"use client";

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Icons } from "@/components/icons";
import { cn } from "@/lib/utils";
import { Task } from "@/types"; // Import Task from the new types file

export interface ChatAndFilesProps {
  chatMessages: { message: string; agent: string }[];
  generatedFiles: string[];
  isPaused: boolean;
  togglePause: () => void;
  tasks: Task[];
  handleTaskGuidance: (taskId: string) => void;
  handleTestCode: (taskId: string) => Promise<void>;
  handleGenerateCode: (taskId: string) => Promise<void>;
  downloadCode: () => void;
  allTasksCompleted: boolean;
}

const ChatAndFiles = ({
  chatMessages,
  generatedFiles,
  isPaused,
  togglePause,
  tasks,
  handleTaskGuidance,
  handleTestCode,
  handleGenerateCode,
  downloadCode,
  allTasksCompleted,
}: ChatAndFilesProps) => {
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
                  <Icons.arrowRight className="mr-2 h-4 w-4" />
                  Resume
                </>
              ) : (
                <>
                  <Icons.pause className="mr-2 h-4 w-4" />
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
                    <Icons.user className="h-4 w-4 text-muted-foreground" />
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
          <Button onClick={downloadCode} className="mt-4">
            <Icons.download className="mr-2 h-4 w-4" />
            Download Code
          </Button>
        )}
      </div>
    </div>
  );
};

export default ChatAndFiles;
