import {
  SandpackProvider,
  SandpackLayout,
  SandpackCodeEditor,
  SandpackPreview,
  useSandpack,
} from "@codesandbox/sandpack-react";
import { Allotment } from "allotment";
import { CourseExercise } from "../page";
import { Button } from "@/components/ui/button";
import { gruvboxDark } from "@codesandbox/sandpack-themes";
import { useParams } from "next/navigation";
import axios from "axios";
import { useState } from "react";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/lib/client/apiError";

type Props = {
  courseExerciseData: CourseExercise | undefined;
  loading: boolean;
};

type ChildrenProps = {
  onCompleteExercise: (files: Record<string, string>) => void;
  isCompleted: boolean;
  completing: boolean;
};

const CodeEditorChildren = ({
  onCompleteExercise,
  isCompleted,
  completing,
}: ChildrenProps) => {
  const { sandpack } = useSandpack();

  const handleComplete = () => {
    const files: Record<string, string> = {};
    for (const [path, fileObj] of Object.entries(sandpack.files)) {
      if (typeof fileObj === "string") {
        files[path] = fileObj;
      } else if (fileObj && typeof fileObj.code === "string") {
        files[path] = fileObj.code;
      }
    }
    onCompleteExercise(files);
  };

  return (
    <div className="font-game absolute bottom-42 flex gap-5 right-5">
      <Button
        variant={"pixel"}
        size={"lg"}
        className="text-xl"
        onClick={() => sandpack.runSandpack()}
      >
        Run Code
      </Button>
      <Button
        variant={"pixel"}
        className="bg-[#a3e534] text-xl"
        size={"lg"}
        onClick={handleComplete}
        disabled={isCompleted || completing}
      >
        {isCompleted
          ? "Already Completed !"
          : completing
          ? "Verifying..."
          : "Mark Completed !"}
      </Button>
    </div>
  );
};

function CodeEditor({ courseExerciseData, loading }: Props) {
  const { exerciseslug } = useParams();
  const exerciseIndex =
    courseExerciseData?.exercises?.findIndex(
      (item) => item.slug == exerciseslug,
    ) ?? -1;
  const hasExercise = exerciseIndex >= 0;

  // Remember which exercise was completed in this session, so the button
  // switches to "Already Completed" right away and cannot be clicked again.
  const exerciseKey = `${courseExerciseData?.courseId}-${courseExerciseData?.chapterId}-${exerciseIndex + 1}`;
  const [completedKey, setCompletedKey] = useState<string | null>(null);
  const [completing, setCompleting] = useState(false);

  const savedAsCompleted = hasExercise
    ? Boolean(
        courseExerciseData?.completedExercise?.find(
          (item) => item?.exerciseId == exerciseIndex + 1,
        ),
      )
    : false;
  const isCompleted = savedAsCompleted || completedKey === exerciseKey;

  const onCompleteExercise = async (files?: Record<string, string>) => {
    if (!courseExerciseData || !hasExercise || completing || isCompleted) {
      return;
    }
    setCompleting(true);
    try {
      // Validated by the server against the exercise's expected pattern
      const result = await axios.post("/api/exercise/complete", {
        courseId: courseExerciseData.courseId,
        chapterId: courseExerciseData.chapterId,
        exerciseId: exerciseIndex + 1,
        files,
      });
      setCompletedKey(exerciseKey);
      toast.success(
        result.data?.alreadyCompleted
          ? "Already completed!"
          : `Exercise Completed! +${result.data?.xpEarned ?? 0} XP`,
      );
    } catch (error) {
      toast.error(
        getApiErrorMessage(error, "Could not save your progress. Please try again."),
      );
    } finally {
      setCompleting(false);
    }
  };

  return (
    <div className="h-full">
      <SandpackProvider
        //@ts-ignore
        template={courseExerciseData?.editorType ?? "react"}
        theme={gruvboxDark}
        style={{
          height: "100vh",
        }}
        files={courseExerciseData?.exerciseData?.exercisesContent?.starterCode}
        options={{
          autorun: false,
          autoReload: false,
        }}
      >
        <SandpackLayout
          style={{
            height: "100%",
          }}
        >
          <Allotment defaultSizes={[50, 50]}>
            <Allotment.Pane minSize={400}>
              <div className="relative h-full">
                <SandpackCodeEditor
                  showTabs
                  style={{
                    height: "100%",
                  }}
                />
                <CodeEditorChildren
                  onCompleteExercise={onCompleteExercise}
                  isCompleted={isCompleted}
                  completing={completing}
                />
              </div>
            </Allotment.Pane>
            <Allotment.Pane minSize={400}>
              <SandpackPreview
                showNavigator
                showOpenInCodeSandbox={false}
                showOpenNewtab
                style={{
                  height: "100%",
                }}
              />
            </Allotment.Pane>
          </Allotment>
        </SandpackLayout>
      </SandpackProvider>
    </div>
  );
}

export default CodeEditor;
