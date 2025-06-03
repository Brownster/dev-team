"use client";

import {useState, useEffect} from "react";
import {planProject} from "@/ai/flows/plan-project";
import {generateCode} from "@/ai/flows/generate-code";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Icons } from "@/components/icons"; // Keep Icons import if used directly here, otherwise move to ChatAndFiles
import React, { useState } from "react"; // Removed useEffect as it's in the hook
import { cn } from "@/lib/utils"; // Keep cn if used directly here
import { Task } from "@/types"; // Task type is used for iterating tasks
import ChatAndFiles from "./ChatAndFiles";
import { useTaskManager } from "@/hooks/useTaskManager"; // Import the custom hook

const DevTeamAIApp = () => {
  const [projectIdea, setProjectIdea] = useState("");
  const {
    tasks,
    loading,
    // currentTaskIndex, // Not directly used in UI rendering decisions here
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
    triggerGenerateCode, // For manual trigger from task item if needed
    triggerTestCode,     // For manual trigger from task item if needed
  } = useTaskManager();

  const onPlanProject = () => {
    if (projectIdea.trim()) {
      handlePlanProject(projectIdea);
    }
  };

  if (developmentStarted) {
    return (
      <ChatAndFiles
        chatMessages={chatMessages}
        generatedFiles={generatedFiles}
        isPaused={isPaused}
        togglePause={togglePause}
        tasks={tasks}
        handleTaskGuidance={handleTaskGuidance}
        handleGenerateCode={triggerGenerateCode} // Pass the trigger function
        handleTestCode={triggerTestCode}         // Pass the trigger function
        downloadCode={downloadCode}
        allTasksCompleted={allTasksCompleted}
      />
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>DevTeamAI - Project Idea</CardTitle>
          <CardDescription>
            Enter your project idea and let the AI Dev Team handle the rest.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col space-y-2">
            <Textarea
              placeholder="Describe your project idea..."
              value={projectIdea}
              onChange={(e) => setProjectIdea(e.target.value)}
              disabled={loading || developmentStarted}
            />
          </div>
          <Button onClick={onPlanProject} disabled={loading || developmentStarted || !projectIdea.trim()}>
            {loading ? "Planning Project..." : "Plan Project"}
          </Button>
        </CardContent>
      </Card>

      {tasks.length > 0 && !developmentStarted && (
        <div className="w-full max-w-4xl mt-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">Development Tasks</h2>
            {tasks.some((task) => task.status === 'review') && (
              <Button onClick={handleApproveAllTasks} disabled={loading}>
                Approve All Tasks
              </Button>
            )}
          </div>
          <Accordion type="single" collapsible className="w-full">
            {tasks.map((task) => (
              <AccordionItem key={task.id} value={task.id}>
                <AccordionTrigger disabled={loading}>
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
                          <Button onClick={() => handleTaskApproval(task.id)} disabled={loading}>
                            Approve Task
                          </Button>
                          <Button
                            variant="destructive"
                            onClick={() => {
                              const feedback = prompt("Please provide feedback for rejecting this task:");
                              if (feedback !== null && feedback.trim()) { // Ensure feedback is not null and not just whitespace
                                handleTaskRejection(task.id, feedback);
                              } else if (feedback !== null) {
                                alert("Feedback cannot be empty.");
                              }
                            }}
                            disabled={loading}
                          >
                            Reject Task
                          </Button>
                        </div>
                      )}
                      {/* Buttons for planning/coding stages are now primarily in ChatAndFiles,
                          but could be added here for non-automated interaction if desired.
                          For now, the automated flow handles this.
                          If manual interaction is needed, use triggerGenerateCode/triggerTestCode from the hook.
                      */}
                       {task.status === 'planning' && (
                          <div className="flex gap-2">
                            <Button onClick={() => triggerGenerateCode(task.id)} disabled={loading}>Manually Generate Code</Button>
                            <Button onClick={() => handleTaskGuidance(task.id)} disabled={loading}>Provide Guidance</Button>
                          </div>
                        )}
                        {task.status === 'coding' && (
                           <div className="flex gap-2">
                            <Button onClick={() => triggerTestCode(task.id)} disabled={loading}>Manually Test Code</Button>
                            <Button onClick={() => handleTaskGuidance(task.id)} disabled={loading}>Provide Guidance</Button>
                          </div>
                        )}
                      {task.code && (
                        <>
                          <h3 className="text-lg font-semibold">Generated Code</h3>
                          <pre className="whitespace-pre-wrap bg-muted p-2 rounded-md">
                            {task.code}
                          </pre>
                        </>
                      )}
                      {task.testResults && (
                        <>
                          <h3 className="text-lg font-semibold">Test Results</h3>
                          <pre className="whitespace-pre-wrap bg-muted p-2 rounded-md">
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

      {tasks.length > 0 &&
        !developmentStarted &&
        tasks.every((task) => task.status !== 'review') && (
          <Button onClick={startDevelopment} className="mt-4" disabled={loading}>
            Start Development
          </Button>
      )}
      {/* Optional: Display a message if development has started but no tasks (edge case) */}
      {tasks.length === 0 && developmentStarted && (
         <p className="mt-4">Development started, awaiting tasks...</p>
      )}
    </div>
  );
};

export default DevTeamAIApp;
