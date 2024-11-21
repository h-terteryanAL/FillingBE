export type TRCreateParticipantByCSV = Promise<[boolean, any, number] | []>;
export type TRChangeParticipantForm = Promise<{
  id: unknown;
  answerCountDifference: number;
}>;
export type TRResponseMsg = Promise<{ message: string }>;
