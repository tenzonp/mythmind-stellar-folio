import { createFileRoute, notFound } from "@tanstack/react-router";
import { isEmployeeId } from "@/lib/employees";
import { ChatLayout } from "@/components/chat/ChatLayout";

export const Route = createFileRoute("/_authenticated/app/$employee/$threadId")({
  beforeLoad: ({ params }) => {
    if (!isEmployeeId(params.employee)) throw notFound();
  },
  component: ChatPage,
});

function ChatPage() {
  const { employee, threadId } = Route.useParams();
  if (!isEmployeeId(employee)) return null;
  return <ChatLayout employee={employee} threadId={threadId} />;
}
