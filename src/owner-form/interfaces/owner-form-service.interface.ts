export type TRCreateParticipantByCSV = Promise<[any, number] | []>;
export type TRChangeParticipantForm = Promise<{
  id: unknown;
  answerCountDifference: number;
}>;
