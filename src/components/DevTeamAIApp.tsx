"use client";

import {useState} from "react";
import {planProject} from "@/ai/flows/plan-project";
import {generateCode} from "@/ai/flows/generate-code";
import {testCode} from "@/ai/flows/test-code";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {Button} from "@/components/ui/button";
import {Textarea} from "@/components/ui/textarea";
import {Input} from "@/components/ui/input";

interface Task {
  id: string;
  description: string;
  assignee: 'Developer' | 'Tester' | 'Planner/Manager' | 'Researcher' | 'Doc Creator';
  status: 'planning' | 'coding' | 'testing' | 'complete';
  code?: string;
  testResults?: string;
}

const DevTeamAIApp = () => {
  const [projectIdea, setProjectIdea] = useState("");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);

  const handlePlanProject = async () => {
    setLoading(true);
    try {
      const plan = await planProject({projectIdea});
      const initialTasks = plan.tasks.map((task, index) => ({
        id: `task-${index}`,
        description: task.description,
        assignee: task.assignee,
        status: 'planning' as Task['status'],
      }));
      setTasks(initialTasks);
    } catch (error) {
      console.error("Failed to plan project:", error);
    } finally {
      setLoading(false);
    }
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
    }
  };

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
          <Button onClick={handlePlanProject} disabled={loading}>
            {loading ? "Planning Project..." : "Plan Project"}
          </Button>
        </CardContent>
      </Card>

      {tasks.length > 0 && (
        <div className="w-full max-w-4xl mt-8">
          <h2 className="text-2xl font-bold mb-4">Development Tasks</h2>
          <div className="space-y-4">
            {tasks.map((task) => (
              <Card key={task.id}>
                <CardHeader>
                  <CardTitle>{task.description}</CardTitle>
                  <CardDescription>
                    Assigned to: {task.assignee} - Status: {task.status}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
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
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DevTeamAIApp;
