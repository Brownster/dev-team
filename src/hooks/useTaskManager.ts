"use client";

import {useState, useEffect, useCallback} from "react";
import { planProject } from "@/ai/flows/plan-project";
import { generateCode } from "@/ai/flows/generate-code";
import { testCode } from "@/ai/flows/test-code";
import { toast } from "@/hooks/use-toast";
import { Task } from "@/types";

export const useTaskManager = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
  const [developmentStarted, setDevelopmentStarted] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [generatedFiles, setGeneratedFiles] = useState<string[]>([]);
  const [chatMessages, setChatMessages] = useState<{ message: string; agent: string }[]>([]);
  const [allTasksCompleted, setAllTasksCompleted] = useState(false);

  const addChatMessage = useCallback((message: string, agent: string) => {
    setChatMessages(prevMessages => [...prevMessages, { message, agent }]);
  }, []);

  const handlePlanProject = useCallback(async (projectIdea: string) => {
    setLoading(true);
    addChatMessage(`Starting project planning for: ${projectIdea}`, 'System');
    try {
      const plan = await planProject({ projectIdea });
      const initialTasks = plan.tasks.map((task, index) => ({
        id: `task-${index}`,
        description: task.description,
        assignee: task.assignee,
        status: 'review' as Task['status'],
      }));
      setTasks(initialTasks);
      addChatMessage('Project planning complete. Please review the tasks.', 'Planner');
    } catch (error) {
      console.error("Failed to plan project:", error);
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred during planning.";
      toast({
        title: "Planning Failed",
        description: `There was an error planning the project: ${errorMessage}. Please try again.`,
        variant: "destructive",
      });
      addChatMessage(`Error during project planning: ${errorMessage}`, 'System');
    } finally {
      setLoading(false);
    }
  }, [addChatMessage]);

  const startDevelopment = useCallback(() => {
    setDevelopmentStarted(true);
    setIsPaused(false); // Ensure development is not paused when starting
    setCurrentTaskIndex(0); // Start from the first task
    addChatMessage('Development started.', 'System');
  }, [addChatMessage]);

  const handleTaskApproval = useCallback((taskId: string) => {
    setTasks(prevTasks => prevTasks.map(task =>
      task.id === taskId ? { ...task, status: 'planning' } : task
    ));
    toast({
      title: "Task Approved",
      description: "The task has been approved and is ready for development.",
    });
    addChatMessage(`Task "${tasks.find(t => t.id === taskId)?.description}" approved.`, 'System');
  }, [addChatMessage, tasks]);

  const handleApproveAllTasks = useCallback(() => {
    setTasks(prevTasks => prevTasks.map(task => ({ ...task, status: 'planning' })));
    toast({
      title: "All Tasks Approved",
      description: "All tasks have been approved and are ready for development.",
    });
    addChatMessage('All tasks approved.', 'System');
  }, [addChatMessage]);

  const handleTaskRejection = useCallback((taskId: string, feedback: string) => {
    console.log(`Task ${taskId} rejected with feedback: ${feedback}`);
    // Potentially update task status to 'rejected' or remove it
    setTasks(prevTasks => prevTasks.map(task =>
      task.id === taskId ? { ...task, status: 'review' } : task // Or some other status like 'rejected'
    ));
    toast({
      title: "Task Rejected",
      description: `The task has been rejected with feedback: ${feedback}. Please review and revise.`,
      variant: "destructive",
    });
    addChatMessage(`Task "${tasks.find(t => t.id === taskId)?.description}" rejected. Feedback: ${feedback}`, 'System');
  }, [addChatMessage, tasks]);


  const handleTaskGuidance = useCallback((taskId: string, newDescription?: string) => {
    const updatedDescription = newDescription || prompt("Please provide guidance for this task:", tasks.find(t => t.id === taskId)?.description);
    if (updatedDescription) {
      setTasks(prevTasks => prevTasks.map(task =>
        task.id === taskId ? { ...task, description: updatedDescription, status: 'planning' } : task // Reset to planning
      ));
      toast({
        title: "Task Updated",
        description: "The task description has been updated with your guidance.",
      });
      addChatMessage(`Task "${tasks.find(t => t.id === taskId)?.description}" updated with new guidance.`, 'System');
    }
  }, [addChatMessage, tasks]);

  const internalHandleGenerateCode = useCallback(async (taskId: string) => {
    setTasks(prevTasks => prevTasks.map(task =>
      task.id === taskId ? { ...task, status: 'coding' } : task
    ));
    addChatMessage(`Generating code for task: "${tasks.find(t => t.id === taskId)?.description}"...`, 'Developer');

    try {
      const task = tasks.find(t => t.id === taskId);
      if (!task) throw new Error("Task not found for code generation.");

      const codeResult = await generateCode({ taskDescription: task.description });
      const newFileName = `GeneratedComponent_${task.assignee}_${Date.now()}.jsx`; // Make filename more descriptive

      setGeneratedFiles(prevFiles => [...prevFiles, newFileName]);
      addChatMessage(`Generated code for task: "${task.description}". File: ${newFileName}`, 'Developer');

      setTasks(prevTasks => prevTasks.map(t =>
        t.id === taskId ? { ...t, code: codeResult.code, status: 'testing' } : t
      ));
      // No automatic trigger for testCode here, useEffect will handle the flow
    } catch (error) {
      console.error("Failed to generate code:", error);
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred during code generation.";
      toast({
        title: "Code Generation Failed",
        description: `Error generating code for task "${tasks.find(t => t.id === taskId)?.description}": ${errorMessage}`,
        variant: "destructive",
      });
      addChatMessage(`Error generating code for task "${tasks.find(t => t.id === taskId)?.description}": ${errorMessage}`, 'Developer');
      setTasks(prevTasks => prevTasks.map(t => t.id === taskId ? { ...t, status: 'planning' } : t)); // Revert status
    }
  }, [tasks, addChatMessage]);

  const internalHandleTestCode = useCallback(async (taskId: string) => {
    setTasks(prevTasks => prevTasks.map(task =>
      task.id === taskId ? { ...task, status: 'testing' } : task // Ensure status is testing
    ));
    addChatMessage(`Testing code for task: "${tasks.find(t => t.id === taskId)?.description}"...`, 'Tester');
    try {
      const task = tasks.find(t => t.id === taskId);
      if (!task?.code) throw new Error("No code found to test for this task.");

      // Using a more generic component name for now, or derive from task
      const componentName = task.description.split(" ")[0] || 'GeneratedComponent';
      const testResults = await testCode({ code: task.code, componentName });
      addChatMessage(`Tested code for task: "${task.description}". Results: ${testResults.results}`, 'Tester');

      setTasks(prevTasks => prevTasks.map(t =>
        t.id === taskId ? { ...t, testResults: testResults.results, status: 'complete' } : t
      ));
      addChatMessage(`Task "${task.description}" completed and tested.`, 'System');
    } catch (error) {
      console.error("Failed to test code:", error);
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred during testing.";
      toast({
        title: "Testing Failed",
        description: `Error testing code for task "${tasks.find(t => t.id === taskId)?.description}": ${errorMessage}`,
        variant: "destructive",
      });
      addChatMessage(`Error testing code for task "${tasks.find(t => t.id === taskId)?.description}": ${errorMessage}`, 'Tester');
      setTasks(prevTasks => prevTasks.map(t => t.id === taskId ? { ...t, status: 'coding' } : t)); // Revert status
    }
  }, [tasks, addChatMessage]);


  const togglePause = useCallback(() => {
    setIsPaused(prev => {
      addChatMessage(prev ? 'Development resumed.' : 'Development paused.', 'System');
      return !prev;
    });
  }, [addChatMessage]);

  const getAllGeneratedCode = useCallback(() => {
    return tasks.filter(task => task.code).map(task => `// Task: ${task.description}\n// Assignee: ${task.assignee}\n${task.code || ''}`).join('\n\n');
  }, [tasks]);

  const downloadCode = useCallback(() => {
    const code = getAllGeneratedCode();
    if (!code.trim()) {
      toast({ title: "No Code", description: "No code has been generated yet.", variant: "destructive" });
      return;
    }
    const blob = new Blob([code], { type: 'text/javascript' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'devteam_ai_generated_code.jsx';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    addChatMessage('Code downloaded.', 'System');
  }, [getAllGeneratedCode, addChatMessage]);

  useEffect(() => {
    if (tasks.length > 0 && tasks.every(task => task.status === 'complete')) {
      setAllTasksCompleted(true);
      addChatMessage('All tasks completed! Project is finished.', 'System');
    } else {
      setAllTasksCompleted(false);
    }
  }, [tasks, addChatMessage]);

  useEffect(() => {
    if (!developmentStarted || isPaused || tasks.length === 0) return;

    const currentTask = tasks[currentTaskIndex];
    if (!currentTask) {
      // This might happen if tasks array is modified unexpectedly
      if (currentTaskIndex >= tasks.length && tasks.length > 0) {
         // All tasks processed or index out of bounds
         if (tasks.every(t => t.status === 'complete')) {
            setAllTasksCompleted(true);
         }
      }
      return;
    }

    if (currentTask.status === 'planning') {
      internalHandleGenerateCode(currentTask.id);
    } else if (currentTask.status === 'coding') { // Should be 'testing' after code gen, but if stuck, this helps
       // This state means it's ready for testing. The status will be updated to 'testing' by internalHandleGenerateCode
       // So, this condition might not be hit directly if internalHandleGenerateCode immediately sets to 'testing'
       // However, if it was manually set or an error occurred, this will re-trigger testing.
       // The actual transition to test is from internalHandleGenerateCode setting status to 'testing'
    } else if (currentTask.status === 'testing') {
       internalHandleTestCode(currentTask.id);
    }
     else if (currentTask.status === 'complete') {
      if (currentTaskIndex < tasks.length - 1) {
        setCurrentTaskIndex(prevIndex => prevIndex + 1);
      } else {
        setAllTasksCompleted(true); // All tasks are complete
      }
    }
  }, [developmentStarted, tasks, currentTaskIndex, isPaused, internalHandleGenerateCode, internalHandleTestCode, addChatMessage]);


  return {
    tasks,
    loading,
    currentTaskIndex,
    developmentStarted,
    isPaused,
    generatedFiles,
    chatMessages,
    allTasksCompleted,
    handlePlanProject,
    startDevelopment,
    handleTaskApproval,
    handleApproveAllTasks,
    handleTaskRejection,
    handleTaskGuidance,
    togglePause,
    downloadCode,
    // Exposing these for direct calls from UI if necessary, though flow is mostly automatic
    triggerGenerateCode: internalHandleGenerateCode,
    triggerTestCode: internalHandleTestCode,
  };
};
