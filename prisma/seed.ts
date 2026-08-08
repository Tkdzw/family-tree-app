// Seeds the database with exactly what's in
// "01_Chiwashira_Ziwenga_Family_Tree_Version_00.25.xlsx" today —
// the "Nyikadzino's 1st & 2nd Gen" sheet, "Grand Sons and Daughters" section.
//
// Run with: npx prisma db seed
//
// This is intentionally a faithful copy of the current spreadsheet, gaps included
// (Hosea Ziwenga and Peter Ziwenga have no children recorded — that's a data gap,
// not a fact). Re-run this after every spreadsheet update, or replace it with a
// real Excel parser once the workbook stabilizes.

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type ChildRecord = { name: string; deceased: boolean };
type BranchRecord = { name: string; children: ChildRecord[] };

const BRANCHES: BranchRecord[] = [
  { name: "Ben Man'arayi Ziwenga", children: [
    { name: "Mununuri Godfery", deceased: false },
    { name: "Tichadii Jericho", deceased: false },
    { name: "Naboth", deceased: false },
    { name: "Big D", deceased: true },
    { name: "Thamary", deceased: false },
    { name: "Audia", deceased: false },
    { name: "Elizabeth Rumbidzai", deceased: false },
    { name: "Farai", deceased: false },
    { name: "Morden", deceased: false },
  ]},
  { name: "Cephas Tafanana Ziwenga", children: [
    { name: "Tsitsi", deceased: false },
    { name: "Blissing Ben", deceased: true },
    { name: "Pardon", deceased: true },
    { name: "Rosemary", deceased: false },
    { name: "Vimbai Bertha", deceased: false },
    { name: "Dherina", deceased: false },
  ]},
  { name: "Cathian Takavengwa Ziwenga", children: [
    { name: "Jabulani Hamadziripi", deceased: false },
    { name: "Deliah Sitsheliwe", deceased: false },
    { name: "Hardon", deceased: false },
    { name: "Wellington", deceased: false },
    { name: "Ophillia", deceased: false },
    { name: "Zivanai", deceased: false },
    { name: "Onai", deceased: false },
  ]},
  { name: "Naison Hatidani Chiwashira", children: [
    { name: "Masimba Morgan", deceased: true },
    { name: "Tafanana", deceased: false },
    { name: "Tawanda Andrew", deceased: false },
    { name: "Tendai Shephard", deceased: false },
    { name: "Tafadzwa Robert", deceased: false },
    { name: "Taziva Donald", deceased: false },
  ]},
  { name: "Jameson Chiwashira", children: [
    { name: "Batsirai Memory", deceased: false },
    { name: "Verengayi Vivian", deceased: false },
    { name: "Tongai Common Well", deceased: false },
    { name: "Edwin Pupurayi", deceased: false },
    { name: "Taudzwei Nodgar", deceased: false },
    { name: "Nellie Nyararai", deceased: false },
    { name: "Rungano Mhan'arai", deceased: false },
  ]},
  { name: "Walter Ziwenga", children: [
    { name: "Tichaona", deceased: true },
    { name: "Wonder", deceased: true },
    { name: "Paradzai", deceased: true },
    { name: "Orsbon", deceased: true },
    { name: "Tarisai", deceased: false },
    { name: "Elizabeth Rufaro", deceased: false },
  ]},
  { name: "Margret Ziwenga", children: [
    { name: "Norwell", deceased: false },
    { name: "David", deceased: false },
    { name: "Noreen", deceased: false },
    { name: "Margret", deceased: false },
    { name: "Marjorie", deceased: true },
    { name: "Sharon", deceased: false },
    { name: "Graduate", deceased: false },
    { name: "Mercy", deceased: false },
  ]},
  { name: "Gilbert Shopa Chiwashira", children: [
    { name: "Erasmus", deceased: true },
    { name: "Emily Tariro", deceased: false },
    { name: "Edith", deceased: false },
  ]},
  { name: "Ephraim Chiwashira", children: [
    { name: "Cliff Farai", deceased: false },
    { name: "Oscar Tinashe", deceased: false },
    { name: "Otillia", deceased: false },
    { name: "Sally", deceased: false },
    { name: "Prosper", deceased: false },
  ]},
  { name: "Levy Tongonzani Ziwenga", children: [
    { name: "John", deceased: false },
    { name: "Renia", deceased: false },
  ]},
  { name: "Dherina Chiwashira", children: [
    { name: "Fungisai", deceased: false },
    { name: "Sithokozile", deceased: false },
    { name: "Zvisinei", deceased: false },
  ]},
  { name: "James T Chiwashira", children: [
    { name: "Maxwell", deceased: false },
  ]},
  { name: "Ignatious Chiwashira", children: [
    { name: "Getrude", deceased: true },
    { name: "Jameson Ticharwa", deceased: false },
    { name: "Brian Nyikadzino", deceased: false },
    { name: "Brighton", deceased: false },
    { name: "Precious Pepukai", deceased: false },
    { name: "Pride", deceased: false },
    { name: "Terence", deceased: false },
  ]},
  { name: "Josephine Chiwashira", children: [
    { name: "Jason", deceased: false },
    { name: "Nelia", deceased: false },
    { name: "Josphat Cornelius", deceased: false },
    { name: "Tafadzwa", deceased: false },
    { name: "Redemptor Tatenda", deceased: false },
    { name: "Vimbai", deceased: true },
    { name: "Kudakwashe", deceased: false },
  ]},
  { name: "Casper Chiwashira", children: [
    { name: "Francis", deceased: false },
    { name: "Florence", deceased: false },
    { name: "Fortunate", deceased: false },
    { name: "Faith", deceased: true },
    { name: "Felistas", deceased: false },
    { name: "Future", deceased: false },
    { name: "Felicity Paidashe", deceased: false },
  ]},
  { name: "Nkosana Nyikadzino Norman Ziwenga", children: [
    { name: "Ronald Zvikomborero", deceased: true },
    { name: "Gertrude Kudzai", deceased: false },
    { name: "Redempta Gamuchirai", deceased: false },
    { name: "Fortunate", deceased: true },
    { name: "Tonderai Lloyd", deceased: false },
    { name: "Jubilee", deceased: false },
  ]},
  { name: "Manasa Chiwashira", children: [
    { name: "Clifford", deceased: false },
    { name: "Edwin", deceased: false },
    { name: "Martha", deceased: false },
    { name: "Natasha", deceased: true },
    { name: "Takudzwa", deceased: true },
  ]},
  { name: "Sabastain Ziwenga", children: [
    { name: "Rosemary", deceased: false },
    { name: "Melinda", deceased: false },
    { name: "Mellissa", deceased: false },
  ]},
  { name: "Rosemary Ziwenga", children: [
    { name: "Tonderai Sebastain", deceased: false },
    { name: "Privilege", deceased: false },
    { name: "Tapiwa Malcom", deceased: false },
    { name: "Tendai Princess", deceased: false },
    { name: "Nyasha Pearl", deceased: false },
  ]},
  { name: "Hosea Ziwenga", children: [] },
  { name: "Peter Ziwenga", children: [] },
];

// splits "Ben Man'arayi Ziwenga" -> firstName "Ben Man'arayi", surname "Ziwenga"
// (last whitespace-separated token treated as surname; good enough for this dataset,
// review manually for compound names like "James T Chiwashira" if it matters to you)
function splitName(fullName: string): { firstName: string; surname: string | null } {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return { firstName: parts[0], surname: null };
  const surname = parts[parts.length - 1];
  const firstName = parts.slice(0, -1).join(" ");
  return { firstName, surname };
}

async function main() {
  console.log("Seeding: clearing existing data...");
  await prisma.parentChild.deleteMany();
  await prisma.union.deleteMany();
  await prisma.person.deleteMany();

  console.log("Creating root ancestor...");
  const root = await prisma.person.create({
    data: {
      firstName: "Nyikadzino Kenias",
      surname: "Bhurenge",
      otherNames: "Tsvimbombiri",
      gender: "M",
      totem: "Mhofu",
      sourceNote: "Family cover page / Scope document",
    },
  });

  let branchCount = 0;
  let childCount = 0;

  for (const branch of BRANCHES) {
    const { firstName, surname } = splitName(branch.name);
    const branchPerson = await prisma.person.create({
      data: {
        firstName,
        surname,
        gender: null, // not recorded in the sheet — fill in during Phase 0 data entry
        totem: "Mhofu",
        sourceNote: "Nyikadzino's 1st & 2nd Gen sheet — branch head",
      },
    });
    branchCount++;

    await prisma.parentChild.create({
      data: { parentId: root.id, childId: branchPerson.id, relType: "biological" },
    });

    for (const child of branch.children) {
      const nameParts = splitName(child.name);
      const childPerson = await prisma.person.create({
        data: {
          firstName: nameParts.firstName,
          surname: nameParts.surname ?? surname, // inherit branch surname if child had none of their own
          deceased: child.deceased,
          sourceNote: "Nyikadzino's 1st & 2nd Gen sheet — Grand Sons and Daughters",
        },
      });
      childCount++;

      await prisma.parentChild.create({
        data: { parentId: branchPerson.id, childId: childPerson.id, relType: "biological" },
      });
    }
  }

  console.log(`Done. Created 1 root, ${branchCount} branches, ${childCount} grandchildren.`);
  console.log("Reminder: Hosea Ziwenga and Peter Ziwenga were seeded with zero children —");
  console.log("that's the current data gap, not a fact. Fill in via Phase 0 data entry.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
