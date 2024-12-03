export enum GovernmentApiStatusEnum {
  submission_initiated = 'submission_initiated',
  submission_validation_passed = 'submission_validation_passed',
  submission_rejected = 'submission_rejected',
  submission_validation_failed = 'submission_validation_failed',
  submission_accepted = 'submission_accepted',
}

export const governmentStatusesAfterProcess = [
  GovernmentApiStatusEnum.submission_validation_failed,
  GovernmentApiStatusEnum.submission_validation_passed,
  GovernmentApiStatusEnum.submission_rejected,
  GovernmentApiStatusEnum.submission_accepted,
];
