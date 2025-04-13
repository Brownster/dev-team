"use client";

import {useState, useEffect} from "react";
import {planProject} from "@/ai/flows/plan-project";
import {generateCode} from "@/ai/flows/generate-code";
import {testCode} from "@/ai/flows/test-code";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {Button} from "@/components/ui/button";
import {Textarea} from "@/components/ui/textarea";
import {Accordion, AccordionContent, AccordionItem, AccordionTrigger} from "@/components/ui/accordion";
import {toast} from "@/hooks/use-toast";
import {Icons} from "@/components/icons";
import {ScrollArea} from "@/components/ui/scroll-area";
import React from "react";
import {cn} from "@/lib/utils";

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
  const [isPaused, setIsPaused] = useState(false);
  const [generatedFiles, setGeneratedFiles] = useState<string[]>([]);
  const [chatMessages, setChatMessages] = useState<
    {
      message: string;
      agent: string;
    }[]
  >([]);

  const [allTasksCompleted, setAllTasksCompleted] = useState(false);
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
      setChatMessages(prevMessages => [...prevMessages, { message: 'Project planning complete. Review tasks.', agent: 'Planner' }]);
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
    setChatMessages(prevMessages => [...prevMessages, { message: 'Development started.', agent: 'System' }]);
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

  const handleApproveAllTasks = () => {
    setTasks(prevTasks => prevTasks.map(task => ({...task, status: 'planning'})));
    toast({
      title: "All Tasks Approved",
      description: "All tasks have been approved and are ready for development.",
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
      const newFileName = `GeneratedComponent_${Date.now()}.jsx`;

      setGeneratedFiles(prevFiles => [...prevFiles, newFileName]);
      setChatMessages(prevMessages => [...prevMessages, { message: `Generated code for task: ${task.description}`, agent: 'Developer' }]);

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
      setChatMessages(prevMessages => [...prevMessages, { message: `Tested code for task: ${task?.description}. Results: ${testResults.results}`, agent: 'Tester' }]);

      setTasks(prevTasks => prevTasks.map(task =>
        task.id === taskId ? {...task, testResults: testResults.results, status: 'complete'} : task
      ));
      setChatMessages(prevMessages => [...prevMessages, { message: `Task ${task?.description} completed.`, agent: 'System' }]);
     } catch (error) {
      console.error("Failed to test code:", error);
      toast({
        title: "Testing Failed",
        description: "There was an error running the tests. Please check the code and try again.",
        variant: "destructive",
      });
    }
  };

  const handleTaskGuidance = (taskId: string) => {
    const newTaskDescription = prompt("Please provide guidance for this task:", tasks.find(t => t.id === taskId)?.description);
    if (newTaskDescription) {
      setTasks(prevTasks => prevTasks.map(task =>
        task.id === taskId ? {...task, description: newTaskDescription} : task
      ));
      toast({
        title: "Task Updated",
        description: "The task description has been updated with your guidance.",
      });
    }
  };
  const togglePause = () => {
    setIsPaused(prev => !prev);
  };

  const getAllGeneratedCode = () => {
    return tasks.map(task => `// Task: ${task.description}\n${task.code || ''}`).join('\n\n');
  };

  const downloadCode = () => {
    const code = getAllGeneratedCode();
    const blob = new Blob([code], { type: 'text/javascript' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'generated_code.jsx';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    if (tasks.length > 0 && tasks.every(task => task.status === 'complete')) {
      setAllTasksCompleted(true);
    } else {
      setAllTasksCompleted(false);
    }
  }, [tasks]);

  useEffect(() => {
    if (developmentStarted && tasks.length > 0 && currentTaskIndex < tasks.length && !isPaused) {
      const currentTask = tasks[currentTaskIndex];
      if (currentTask.status === 'planning') {
        handleGenerateCode(currentTask.id);
      } else if (currentTask.status === 'testing') {
        handleTestCode(currentTask.id);
      }
       else if (currentTask.status === 'complete' && currentTaskIndex < tasks.length - 1) {
        setCurrentTaskIndex(currentTaskIndex + 1);
      } else if (currentTask.status === 'complete' && currentTaskIndex === tasks.length -1){
        setAllTasksCompleted(true);
      }
    }
  }, [developmentStarted, tasks, currentTaskIndex, isPaused]);

  const ChatAndFiles = ({chatMessages, generatedFiles, isPaused, togglePause, tasks, handleTaskGuidance, handleTestCode, handleGenerateCode, downloadCode, allTasksCompleted}: {chatMessages: { message: string; agent: string; }[], generatedFiles: string[], isPaused: boolean, togglePause: () => void, tasks: Task[], handleTaskGuidance: (taskId: string) => void, handleTestCode: (taskId: string) => Promise<void>, handleGenerateCode: (taskId: string) => Promise<void>, downloadCode: () => void, allTasksCompleted: boolean}) => {
    return (
      
        <div className="flex flex-col items-center justify-center min-h-screen p-4">
          <Card className="w-full max-w-4xl">
            <CardHeader>
              <CardTitle>Development in Progress</CardTitle>
              <CardDescription>Here are the real-time updates from the AI Dev Team.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">Chat Log</h2>
                <Button variant="outline" onClick={togglePause}>
                  {isPaused ? (
                    <>
                      <Icons.arrowRight className="mr-2 h-4 w-4"/>
                      Resume
                    </>
                  ) : (
                    <>
                      <Icons.pause className="mr-2 h-4 w-4"/>
                      Pause
                    </>
                  )}
                </Button>
              </div>
              <ScrollArea className="h-64 rounded-md border p-4">
                <div className="space-y-2">
                  {chatMessages.map((message, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <div className="rounded-full bg-muted h-8 w-8 flex items-center justify-center">
                        <Icons.user className="h-4 w-4 text-muted-foreground"/>
                      </div>
                      <div className="flex flex-col">
                        <div className="text-sm font-medium">{message.agent}</div>
                        <div className="text-sm">{message.message}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
              <h2 className="text-2xl font-bold mt-4">Generated Files</h2>
              <div className="space-y-2">
                {generatedFiles.map((file, index) => (
                  <p key={index}>{file}</p>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="w-full max-w-4xl mt-8">
            <h2 className="text-2xl font-bold">Tasks</h2>
            <Accordion type="single" collapsible>
              {tasks.map((task) => (
                <AccordionItem key={task.id} value={task.id}>
                  <AccordionTrigger className={cn(task.status === 'complete' ? 'text-green-500' : '')}>
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
                        {task.status === 'planning' && (
                          <div className="flex gap-2">
                            <Button onClick={() => handleGenerateCode(task.id)}>Generate Code</Button>
                            <Button onClick={() => handleTaskGuidance(task.id)}>Provide Guidance</Button>
                          </div>
                        )}
                        {task.status === 'coding' && (
                          <div className="flex gap-2">
                            <Button onClick={() => handleTestCode(task.id)}>Test Code</Button>
                            <Button onClick={() => handleTaskGuidance(task.id)}>Provide Guidance</Button>
                          </div>
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
             {allTasksCompleted && (
              <Button onClick={downloadCode}>
                <Icons.download className="mr-2 h-4 w-4"/>
                Download Code
              </Button>
            )}
          </div>
        </div>
      
    );
  };

  if (developmentStarted) {
    return <ChatAndFiles chatMessages={chatMessages} generatedFiles={generatedFiles} isPaused={isPaused} togglePause={togglePause} tasks={tasks} handleTaskGuidance={handleTaskGuidance} handleTestCode={handleTestCode} handleGenerateCode={handleGenerateCode} downloadCode={downloadCode} allTasksCompleted={allTasksCompleted}/>
  }

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
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Development Tasks</h2>
              {tasks.some(task => task.status === 'review') && (
                <Button onClick={handleApproveAllTasks}>Approve All Tasks</Button>
              )}
            </div>
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
                          <div className="flex gap-2">
                            <Button onClick={() => handleGenerateCode(task.id)}>Generate Code</Button>
                            <Button onClick={() => handleTaskGuidance(task.id)}>Provide Guidance</Button>
                          </div>
                        )}
                        {task.status === 'coding' && (
                          <div className="flex gap-2">
                            <Button onClick={() => handleTestCode(task.id)}>Test Code</Button>
                            <Button onClick={() => handleTaskGuidance(task.id)}>Provide Guidance</Button>
                          </div>
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
