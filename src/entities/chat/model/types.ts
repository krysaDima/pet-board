export type Message = {
  id: string;
  senderId: string;
  body: string;
  sentAt: string;
};

export type ChatThread = {
  id: string;
  participantIds: string[];
  messages: Message[];
};
