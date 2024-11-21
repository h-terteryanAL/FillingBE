export const BOIRTaxIdTypeParser = (value) => {
  switch (value) {
    case 'EIN':
      return '2';
    case 'Foreign':
      return '9';
    case 'SSN/ITIN':
      return '1';
  }
};

export const BOIRDateParser = (date) => {
  const year = date.getFullYear().toString();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');

  return `${year}${month}${day}`;
};

export const BOIRBooleanTypeParser = (value: boolean) => (value ? 'Y' : 'F');

export const BOIRParticipantDocTypeParser = (type) => {
  switch (type) {
    case "State issued driver's license":
      return '37';
    case 'State/Local/Tribe issued ID':
      return '38';
    case 'US Passport':
      return '39';
    case 'Foreign Passport':
      return '40';
  }
};
