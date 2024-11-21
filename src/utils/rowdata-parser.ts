const findSectionsIndices = (headers) => {
  let applicantStartIndex = -1;
  let applicantEndIndex = -1;
  let ownerStartIndex = -1;
  let ownerEndIndex = -1;

  for (let i = 0; i < headers.length; i++) {
    if (headers[i].startsWith('Applicant')) {
      if (applicantStartIndex === -1) {
        applicantStartIndex = i;
      }
      applicantEndIndex = i;
    } else if (headers[i].startsWith('Owner')) {
      if (ownerStartIndex === -1) {
        ownerStartIndex = i;
      }
      ownerEndIndex = i;
    }
  }

  return {
    applicantStartIndex,
    applicantEndIndex,
    ownerStartIndex,
    ownerEndIndex,
  };
};
