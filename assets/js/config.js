/* =====================================================
   EDIT YOUR SHOP DETAILS HERE — nothing else needs changing
   ===================================================== */
export const SHOP = {
  name:      "KARNATAKA ONE",
  tagline:   "Aadhaar update, ration card changes, Pahani (RTC), Encumbrance Certificate, xerox, printing and student project work — done quickly with friendly help.",
  area:      "District Hospital Road, Chikkaballapur",
  address:   "District Hospital Road, Chikkaballapur, Karnataka – 562101",
  landmark:  "Opposite District Hospital, beside Vidya Amruth PU College",
  hoursShort:"Mon–Sat, 9:00 AM – 6:00 PM",
  hoursFull: "Monday to Saturday: 9:00 AM – 6:00 PM · Sunday: Closed",
  // Used for the live "Open now / Closed" badge (India time).
  // days: 0 = Sunday, 1 = Monday … 6 = Saturday. Times are 24-hour "HH:MM".
  hours:     { days: [1, 2, 3, 4, 5, 6], open: "09:00", close: "18:00" },
  phone:     "+918711865011",                     // used for the call link
  phoneShow: "+91 87118 65011",                   // how it's displayed
  whatsapp:  "918711865011",                      // enquiries are sent here (country code, no +)
  lat:       13.436045894119191,
  lng:       77.72526969805185
};

/* icon: one of id, grain, land, deed, print, grad, screen
   featured: true makes the card larger on wide screens */
export const SERVICES = [
  { icon:"id", featured:true, name:"Aadhaar Update",
    desc:"Update name, address, date of birth, mobile number, photo or fingerprints.",
    docs:["Original Aadhaar card / number","Proof of Identity (PAN, Voter ID, Passport, etc.) for name change","Proof of Address (Voter ID, bank passbook, electricity bill, etc.) for address change","Birth certificate / SSLC marks card for date of birth change","Mobile / photo / biometric update: only Aadhaar and your presence"]},
  { icon:"grain", featured:true, name:"Ration Card Update",
    desc:"Add or remove family members, correct names, change head of family, e-KYC.",
    docs:["Existing ration card","Aadhaar of all family members","Birth certificate (to add a child)","Marriage certificate (to add spouse)","Death certificate (to remove a member)"]},
  { icon:"land", name:"Pahani / RTC",
    desc:"Get Record of Rights, Tenancy & Crops (land record) copies.",
    docs:["District, taluk, hobli and village name","Survey number / Hissa number","Owner's name (helpful for verification)"]},
  { icon:"deed", name:"Encumbrance Certificate (EC)",
    desc:"Apply for EC to check the property's transaction history.",
    docs:["Property details: survey / site / khata number","Village and sub-registrar office","Period required (from – to year)","Applicant's Aadhaar and mobile number"]},
  { icon:"print", name:"Xerox, Print & Scan",
    desc:"Black & white and colour xerox, printouts, scanning, lamination.",
    docs:["Original documents, or","Soft copy via WhatsApp / email / pen drive"]},
  { icon:"grad", name:"Student Projects",
    desc:"Project typing, printing, spiral / soft binding and record work.",
    docs:["Soft copy (Word / PDF) or handwritten draft","College format / guidelines, if any","Number of copies and binding type"]},
  { icon:"screen", name:"Other Online Services",
    desc:"Online applications, form filling and other citizen services.",
    docs:["Call us to check what is needed for your work"]}
];
