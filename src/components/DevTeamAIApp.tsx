"use client";

import {useState} from "react";
import {planProject} from "@/ai/flows/plan-project";
import {generateCode} from "@/ai/flows/generate-code";
import {testCode} from "@/ai/flows/test-code";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {Button} from "@/components/ui/button";
import {Textarea} from "@/components/ui/textarea";
import {Input} from "@/components/ui/input";
import {Accordion, AccordionContent, AccordionItem, AccordionTrigger} from "@/components/ui/accordion";
import {toast} from "@/hooks/use-toast";
import {useEffect} from "react";

interface Task {
  id: string;
  description: string;
  assignee: 'Developer' | 'Tester' | 'Researcher' | 'Doc Creator';
  status: 'planning' | 'coding' | 'testing' | 'complete' | 'review';
  code?: string;
  testResults?: string;
}

const DevTeamAIApp = () => {
  const [projectIdea, setProjectIdea] = useState("");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
  const [developmentStarted, setDevelopmentStarted] = useState(false);

  const handlePlanProject = async () => {
    setLoading(true);
    try {
      const plan = await planProject({projectIdea});
      const initialTasks = plan.tasks.map((task, index) => ({
        id: `task-${index}`,
        description: task.description,
        assignee: task.assignee,
        status: 'review' as Task['status'], // Initial state is 'review'
      }));
      setTasks(initialTasks);
    } catch (error) {
      console.error("Failed to plan project:", error);
      toast({
        title: "Planning Failed",
        description: "There was an error planning the project. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const startDevelopment = () => {
    setDevelopmentStarted(true);
  };

  const handleTaskApproval = (taskId: string) => {
    setTasks(prevTasks => prevTasks.map(task =>
      task.id === taskId ? {...task, status: 'planning'} : task
    ));
    toast({
      title: "Task Approved",
      description: "The task has been approved and is ready for development.",
    });
  };

  const handleTaskRejection = (taskId: string, feedback: string) => {
    // Implement logic to handle task rejection and feedback
    console.log(`Task ${taskId} rejected with feedback: ${feedback}`);
    toast({
      title: "Task Rejected",
      description: "The task has been rejected. Please review and revise.",
      variant: "destructive",
    });
  };

  const handleGenerateCode = async (taskId: string) => {
    setTasks(prevTasks => prevTasks.map(task =>
      task.id === taskId ? {...task, status: 'coding'} : task
    ));

    try {
      const task = tasks.find(t => t.id === taskId);
      if (!task) return;

      const codeResult = await generateCode({taskDescription: task.description});

      setTasks(prevTasks => prevTasks.map(task =>
        task.id === taskId ? {...task, code: codeResult.code, status: 'testing'} : task
      ));

      handleTestCode(taskId); // Automatically trigger testing after code generation
    } catch (error) {
      console.error("Failed to generate code:", error);
      toast({
        title: "Code Generation Failed",
        description: "There was an error generating the code. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleTestCode = async (taskId: string) => {
    try {
      const task = tasks.find(t => t.id === taskId);
      if (!task?.code) return;

      const testResults = await testCode({code: task.code, componentName: 'GeneratedComponent'});

      setTasks(prevTasks => prevTasks.map(task =>
        task.id === taskId ? {...task, testResults: testResults.results, status: 'complete'} : task
      ));
    } catch (error) {
      console.error("Failed to test code:", error);
      toast({
        title: "Testing Failed",
        description: "There was an error running the tests. Please check the code and try again.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (developmentStarted && tasks.length > 0 && currentTaskIndex < tasks.length) {
      const currentTask = tasks[currentTaskIndex];
      if (currentTask.status === 'planning') {
        handleGenerateCode(currentTask.id);
      } else if (currentTask.status === 'complete' && currentTaskIndex < tasks.length - 1) {
        setCurrentTaskIndex(currentTaskIndex + 1);
      }
    }
  }, [developmentStarted, tasks, currentTaskIndex]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>DevTeamAI - Project Idea</CardTitle>
          <CardDescription>Enter your project idea and let the AI Dev Team handle the rest.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col space-y-2">
            <Textarea
              placeholder="Describe your project idea..."
              value={projectIdea}
              onChange={(e) => setProjectIdea(e.target.value)}
            />
          </div>
          <Button onClick={handlePlanProject} disabled={loading || developmentStarted}>
            {loading ? "Planning Project..." : "Plan Project"}
          </Button>
        </CardContent>
      </Card>

      {tasks.length > 0 && (
        <div className="w-full max-w-4xl mt-8">
          <h2 className="text-2xl font-bold mb-4">Development Tasks</h2>
          <Accordion type="single" collapsible>
            {tasks.map((task) => (
              <AccordionItem key={task.id} value={task.id}>
                <AccordionTrigger>
                  {task.description} - Assigned to: {task.assignee} - Status: {task.status}
                </AccordionTrigger>
                <AccordionContent>
                  <Card>
                    <CardHeader>
                      <CardTitle>{task.description}</CardTitle>
                      <CardDescription>
                        Assigned to: {task.assignee} - Status: {task.status}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {task.status === 'review' && (
                        <div className="flex gap-2">
                          <Button onClick={() => handleTaskApproval(task.id)}>Approve Task</Button>
                          <Button variant="destructive" onClick={() => {
                            const feedback = prompt("Please provide feedback for rejecting this task:");
                            if (feedback) {
                              handleTaskRejection(task.id, feedback);
                            }
                          }}>Reject Task</Button>
                        </div>
                      )}
                      {task.status === 'planning' && (
                        <Button onClick={() => handleGenerateCode(task.id)}>Generate Code</Button>
                      )}
                      {task.code && (
                        <>
                          <h3 className="text-lg font-semibold">Generated Code</h3>
                          <pre className="whitespace-pre-wrap">
                            {task.code}
                          </pre>
                        </>
                      )}
                      {task.testResults && (
                        <>
                          <h3 className="text-lg font-semibold">Test Results</h3>
                          <pre className="whitespace-pre-wrap">
                            {task.testResults}
                          </pre>
                        </>
                      )}
                    </CardContent>
                  </Card>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      )}

      {tasks.length > 0 && (
        <Button onClick={startDevelopment} disabled={developmentStarted || tasks.some(task => task.status === 'review')}>
          {developmentStarted ? "Development Started" : "Start Development"}
        </Button>
      )}
    </div>
  );
};

export default DevTeamAIApp;
