import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({
  adapter,
});

const academicYear = "2026-27";
const semester = 5;

// =====================================================
// SYNTHETIC STUDENT DATA
// =====================================================

const studentNames = [
  "Bhabana Agrawal",
  "Aarav Sharma",
  "Ananya Patel",
  "Aditya Verma",
  "Aditi Mishra",
  "Arjun Singh",
  "Ananya Das",
  "Aryan Gupta",
  "Avni Mehta",
  "Ayush Kumar",
  "Bhavya Reddy",
  "Chaitanya Rao",
  "Diya Sharma",
  "Dhruv Patel",
  "Esha Gupta",
  "Ishaan Verma",
  "Isha Singh",
  "Kabir Das",
  "Kavya Mehta",
  "Karan Sharma",
  "Khushi Patel",
  "Krishna Kumar",
  "Lakshya Gupta",
  "Mahi Verma",
  "Manav Singh",
  "Meera Das",
  "Mihir Rao",
  "Nandini Sharma",
  "Neha Patel",
  "Nikhil Gupta",
  "Nisha Verma",
  "Om Singh",
  "Palak Das",
  "Parth Mehta",
  "Pihu Sharma",
  "Pranav Patel",
  "Priya Kumar",
  "Rahul Gupta",
  "Riya Verma",
  "Rohan Singh",
  "Roshni Das",
  "Sakshi Rao",
  "Sameer Sharma",
  "Samira Patel",
  "Sanjay Gupta",
  "Sara Verma",
  "Shivam Singh",
  "Shreya Das",
  "Siddharth Mehta",
  "Simran Sharma",
  "Sneha Patel",
  "Soham Kumar",
  "Sonali Gupta",
  "Sourav Verma",
  "Tanmay Singh",
  "Tanya Das",
  "Tanish Rao",
  "Tarun Sharma",
  "Trisha Patel",
  "Uday Gupta",
  "Vaibhav Verma",
  "Varun Singh",
  "Vansh Das",
  "Vedant Mehta",
  "Vibha Sharma",
  "Vikas Patel",
  "Vinay Kumar",
  "Vivek Gupta",
  "Yash Verma",
  "Yashika Singh",
  "Zoya Das",
  "Abhinav Rao",
  "Akash Sharma",
  "Akanksha Patel",
  "Aman Gupta",
  "Amrita Verma",
  "Aniket Singh",
  "Anjali Das",
  "Anmol Mehta",
  "Ansh Sharma",
  "Anushka Patel",
  "Arnav Kumar",
  "Arpita Gupta",
  "Ashish Verma",
  "Ashna Singh",
  "Atul Das",
  "Ayesha Rao",
  "Bharat Sharma",
  "Bharti Patel",
  "Bhuvan Gupta",
  "Chetan Verma",
  "Chirag Singh",
  "Deepak Das",
  "Deepika Mehta",
  "Dev Sharma",
  "Devika Patel",
  "Dheeraj Kumar",
  "Disha Gupta",
  "Divyansh Verma",
  "Ekta Singh",
  "Gaurav Das",
  "Gauri Rao",
  "Harsh Sharma",
  "Harshita Patel",
  "Himanshu Gupta",
  "Hina Verma",
  "Hrithik Singh",
  "Jatin Das",
  "Jaya Mehta",
  "Jhanvi Sharma",
  "Kartik Patel",
  "Kashish Kumar",
  "Komal Gupta",
  "Kriti Verma",
  "Kunal Singh",
  "Lavanya Das",
  "Lokesh Rao",
  "Madhav Sharma",
  "Mahima Patel",
  "Manisha Gupta",
  "Mayank Verma",
  "Mitali Singh",
  "Mohit Das",
  "Muskan Mehta",
  "Naman Sharma",
  "Namita Patel",
  "Navya Kumar",
  "Naveen Gupta",
  "Neel Verma",
  "Neha Singh",
  "Nikita Das",
  "Nitin Rao",
  "Pallavi Sharma",
  "Pankaj Patel",
  "Payal Gupta",
  "Pooja Verma",
  "Prakash Singh",
  "Prateek Das",
  "Preeti Mehta",
  "Pulkit Sharma",
  "Rachit Patel",
  "Radhika Kumar",
  "Raj Gupta",
  "Rajesh Verma",
  "Rajiv Singh",
  "Rakhi Das",
  "Ramesh Rao",
  "Rani Sharma",
  "Ravi Patel",
  "Reena Gupta",
  "Reyansh Verma",
  "Richa Singh",
  "Ritik Das",
  "Ritu Mehta",
  "Riya Sharma",
  "Rohit Patel",
  "Ronit Kumar",
  "Sachin Gupta",
  "Sagar Verma",
  "Saloni Singh",
  "Samar Das",
  "Sana Rao",
  "Sanjana Sharma",
  "Sanya Patel",
  "Saransh Gupta",
  "Shalini Verma",
  "Shashank Singh",
  "Shefali Das",
  "Shikha Mehta",
  "Shivani Sharma",
  "Shrey Patel",
  "Shruti Kumar",
  "Sonal Gupta",
  "Sudeep Verma",
  "Suman Singh",
  "Sunil Das",
  "Suraj Rao",
  "Swati Sharma",
  "Tanu Patel",
  "Tejas Gupta",
  "Tina Verma",
  "Ujjwal Singh",
  "Uma Das",
  "Utkarsh Mehta",
  "Varsha Sharma",
  "Vasu Patel",
  "Veer Kumar",
  "Venkatesh Gupta",
  "Vidhi Verma",
  "Vijay Singh",
  "Vikram Das",
  "Vimal Rao",
  "Vineet Sharma",
  "Vishal Patel",
  "Vishnu Gupta",
  "Yamini Verma",
  "Yashwant Singh",
  "Yuvraj Das",
  "Zain Rao",
  "Zara Sharma",
  "Aarohi Patel",
  "Aashish Gupta",
  "Aastha Verma",
  "Abhay Singh",
  "Abhishek Das",
  "Aditi Rao",
  "Advik Sharma",
  "Ahana Patel",
  "Aishwarya Gupta",
  "Akshay Verma",
  "Alisha Singh",
  "Alok Das",
  "Aman Rao",
  "Ambika Sharma",
  "Amey Patel",
  "Amisha Kumar",
  "Amol Gupta",
  "Amrendra Verma",
  "Anaya Singh",
  "Anirudh Das",
  "Ankita Mehta",
  "Ankur Sharma",
  "Anush Patel",
  "Apoorva Gupta",
  "Archana Verma",
  "Armaan Singh",
  "Arushi Das",
  "Ashok Rao",
  "Asmita Sharma",
  "Avantika Patel",
  "Avinash Kumar",
  "Bani Gupta",
  "Bharat Verma",
  "Bipin Singh",
  "Charu Das",
  "Damini Mehta",
  "Darsh Sharma",
  "Darshan Patel",
  "Deeksha Gupta",
  "Dhanush Verma",
  "Diksha Singh",
  "Dinesh Das",
  "Divya Rao",
  "Eshaan Sharma",
  "Falguni Patel",
  "Farhan Kumar",
  "Garima Gupta",
  "Girish Verma",
  "Hardeep Singh",
  "Harini Das",
  "Hemant Mehta",
  "Ila Sharma",
  "Indu Patel",
  "Ira Gupta",
  "Jai Verma",
  "Jatin Singh",
  "Jeevika Das",
  "Jyoti Rao",
  "Kajal Sharma",
  "Kamal Patel",
  "Kanchan Gupta",
  "Kavita Verma",
  "Keshav Singh",
  "Kiran Das",
  "Kirti Mehta",
  "Kishan Sharma",
  "Kriti Patel",
  "Krish Gupta",
  "Kritika Verma",
  "Lalit Singh",
  "Leena Das",
  "Mansi Rao",
  "Manya Sharma",
  "Mukul Patel",
  "Naina Gupta",
  "Nakul Verma",
  "Naman Singh",
  "Nandita Das",
  "Nihar Mehta",
  "Niharika Sharma",
  "Nilesh Patel",
  "Nupur Kumar",
  "Ojas Gupta",
  "Pankhuri Verma",
  "Pari Singh",
  "Pragya Das",
  "Pratham Rao",
  "Prisha Sharma",
  "Raghav Patel",
  "Rashi Gupta",
  "Ratul Verma",
  "Ravina Singh",
  "Riddhi Das",
  "Rishabh Mehta",
  "Rishika Sharma",
  "Ritesh Patel",
  "Rupali Gupta",
  "Saksham Verma",
  "Sana Singh",
  "Sarthak Das",
];

// Make sure the list has exactly 300 students.
if (studentNames.length !== 300) {
  throw new Error(
    `Expected exactly 300 student names, found ${studentNames.length}`
  );
}


// =====================================================
// TEACHER DATA
// =====================================================

const teacherData = [
  {
    teacherId: "FAC001",
    name: "Remove Email",
    email: "eremove26@gmail.com",
  },
  {
    teacherId: "FAC002",
    name: "Dr. Anil Sharma",
    email: "anil.sharma@spas.edu.in",
  },
  {
    teacherId: "FAC003",
    name: "Dr. Priya Mishra",
    email: "priya.mishra@spas.edu.in",
  },
  {
    teacherId: "FAC004",
    name: "Prof. Rajesh Kumar",
    email: "rajesh.kumar@spas.edu.in",
  },
  {
    teacherId: "FAC005",
    name: "Prof. Neha Patel",
    email: "neha.patel@spas.edu.in",
  },
  {
    teacherId: "FAC006",
    name: "Dr. Sandeep Rao",
    email: "sandeep.rao@spas.edu.in",
  },
  {
    teacherId: "FAC007",
    name: "Prof. Kavita Das",
    email: "kavita.das@spas.edu.in",
  },
  {
    teacherId: "FAC008",
    name: "Dr. Amit Gupta",
    email: "amit.gupta@spas.edu.in",
  },
  {
    teacherId: "FAC009",
    name: "Prof. Sneha Verma",
    email: "sneha.verma@spas.edu.in",
  },
  {
    teacherId: "FAC010",
    name: "Dr. Vikram Singh",
    email: "vikram.singh@spas.edu.in",
  },
  {
    teacherId: "FAC011",
    name: "Prof. Ritu Mehta",
    email: "ritu.mehta@spas.edu.in",
  },
  {
    teacherId: "FAC012",
    name: "Dr. Manish Rao",
    email: "manish.rao@spas.edu.in",
  },
  {
    teacherId: "FAC013",
    name: "Prof. Pooja Sharma",
    email: "pooja.sharma@spas.edu.in",
  },
];

async function main() {
  console.log("=================================");
  console.log("Starting database seed...");
  console.log("=================================\n");


  // =====================================================
  // 1. CREATE SECTIONS
  // =====================================================

  const sectionData = [
    {
      name: "A",
      branch: "CSE",
      semester,
      academicYear,
    },
    {
      name: "B",
      branch: "CSE",
      semester,
      academicYear,
    },
    {
      name: "A",
      branch: "CSE-AIML",
      semester,
      academicYear,
    },
  ];

  const sections = [];

  for (const data of sectionData) {
    const section = await prisma.section.upsert({
      where: {
        name_branch_semester_academicYear: {
          name: data.name,
          branch: data.branch,
          semester: data.semester,
          academicYear: data.academicYear,
        },
      },
      update: {},
      create: data,
    });

    sections.push(section);
  }

  console.log("✓ 3 sections created");


  // =====================================================
  // 2. CREATE SUBJECTS
  // =====================================================

  const subjectData = [
    {
      code: "OS",
      name: "Operating Systems",
    },
    {
      code: "TOC",
      name: "Theory of Computation",
    },
    {
      code: "CN",
      name: "Computer Networks",
    },
    {
      code: "DBMS",
      name: "Database Management Systems",
    },
    {
      code: "COA",
      name: "Computer Organization and Architecture",
    },
    {
      code: "DAA",
      name: "Design and Analysis of Algorithms",
    },
    {
      code: "ML",
      name: "Machine Learning",
    },
    {
      code: "AI",
      name: "Artificial Intelligence",
    },
  ];

  const subjects = [];

  for (const data of subjectData) {
    const subject = await prisma.subject.upsert({
      where: {
        code: data.code,
      },
      update: {
        name: data.name,
      },
      create: data,
    });

    subjects.push(subject);
  }

  console.log("✓ 8 subjects created");


  // =====================================================
  // 3. CREATE 300 STUDENTS
  // =====================================================

  let studentNumber = 1;

  for (const section of sections) {
    const students = [];

    for (let i = 1; i <= 100; i++) {
      const index = studentNumber - 1;

      const studentId =
        `STU${String(studentNumber).padStart(3, "0")}`;

      const name = studentNames[index];

      /*
        Every student receives a unique synthetic email.

        Bhabana keeps your real testing email.
        The other 299 emails are synthetic.
      */
      const email =
        studentNumber === 1
          ? "bhavn0910@gmail.com"
          : `${name
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, ".")
              .replace(/^\.+|\.+$/g, "")}.${String(studentNumber).padStart(3, "0")}@spas-test.edu.in`;

      students.push({
        studentId,
        name,
        sectionId: section.id,
        collegeEmail: email,
      });

      studentNumber++;
    }

    /*
      We use upsert individually because collegeEmail is unique
      and this makes the seed safely re-runnable.
    */
    for (const student of students) {
      await prisma.student.upsert({
        where: {
          studentId: student.studentId,
        },
        update: {
          name: student.name,
          collegeEmail: student.collegeEmail,
          sectionId: student.sectionId,
        },
        create: student,
      });
    }

    console.log(
      `✓ 100 students added to ${section.branch}-${section.name}`
    );
  }


  // =====================================================
  // 4. CREATE 13 TEACHERS
  // =====================================================

  const teachers = [];

  for (const data of teacherData) {
    const teacher = await prisma.teacher.upsert({
      where: {
        teacherId: data.teacherId,
      },
      update: {
        name: data.name,
        collegeEmail: data.email,
      },
      create: {
        teacherId: data.teacherId,
        name: data.name,
        collegeEmail: data.email,
      },
    });

    teachers.push(teacher);
  }

  console.log("✓ 13 faculty created");


  // =====================================================
  // 5. GET SUBJECT REFERENCES
  // =====================================================

  const OS = subjects.find(
    (subject) => subject.code === "OS"
  )!;

  const TOC = subjects.find(
    (subject) => subject.code === "TOC"
  )!;

  const CN = subjects.find(
    (subject) => subject.code === "CN"
  )!;

  const DBMS = subjects.find(
    (subject) => subject.code === "DBMS"
  )!;

  const COA = subjects.find(
    (subject) => subject.code === "COA"
  )!;

  const DAA = subjects.find(
    (subject) => subject.code === "DAA"
  )!;

  const ML = subjects.find(
    (subject) => subject.code === "ML"
  )!;

  const AI = subjects.find(
    (subject) => subject.code === "AI"
  )!;


  // =====================================================
  // 6. GET SECTION REFERENCES
  // =====================================================

  const CSEA = sections.find(
    (section) =>
      section.branch === "CSE" &&
      section.name === "A"
  )!;

  const CSEB = sections.find(
    (section) =>
      section.branch === "CSE" &&
      section.name === "B"
  )!;

  const AIMLA = sections.find(
    (section) =>
      section.branch === "CSE-AIML" &&
      section.name === "A"
  )!;


  // =====================================================
  // 7. TEACHING ASSIGNMENTS
  // =====================================================

  const assignments = [

    // -------------------------
    // CSE-A
    // -------------------------

    [teachers[3], OS, CSEA],
    [teachers[8], TOC, CSEA],
    [teachers[1], CN, CSEA],
    [teachers[10], DBMS, CSEA],
    [teachers[5], COA, CSEA],
    [teachers[7], DAA, CSEA],

    // -------------------------
    // CSE-B
    // -------------------------

    [teachers[0], OS, CSEB],
    [teachers[6], TOC, CSEB],
    [teachers[11], CN, CSEB],
    [teachers[4], DBMS, CSEB],
    [teachers[2], COA, CSEB],
    [teachers[9], DAA, CSEB],

    // -------------------------
    // CSE-AIML-A
    // -------------------------

    [teachers[5], OS, AIMLA],
    [teachers[2], TOC, AIMLA],
    [teachers[9], CN, AIMLA],
    [teachers[0], DBMS, AIMLA],
    [teachers[6], ML, AIMLA],
    [teachers[11], AI, AIMLA],

  ] as const;


  // =====================================================
  // 8. INSERT TEACHING ASSIGNMENTS
  // =====================================================

  for (const [teacher, subject, section] of assignments) {
    await prisma.teachingAssignment.upsert({
      where: {
        teacherId_subjectId_sectionId_academicYear_semester: {
          teacherId: teacher.id,
          subjectId: subject.id,
          sectionId: section.id,
          academicYear,
          semester,
        },
      },

      update: {},

      create: {
        teacherId: teacher.id,
        subjectId: subject.id,
        sectionId: section.id,
        academicYear,
        semester,
      },
    });
  }

  console.log("✓ 18 teaching assignments created");


  // =====================================================
  // 9. VERIFY TEST USERS
  // =====================================================

  const testStudent = await prisma.student.findUnique({
    where: {
      collegeEmail: "bhabanaagrawal1111@gmail.com",
    },
    include: {
      section: true,
    },
  });

  const testTeacher = await prisma.teacher.findUnique({
    where: {
      collegeEmail: "eremove26@gmail.com",
    },
  });

  console.log("\n=================================");
  console.log("TEST STUDENT");
  console.log("=================================");
  console.log("Name       :", testStudent?.name);
  console.log("Email      :", testStudent?.collegeEmail);
  console.log("Student ID :", testStudent?.studentId);
  console.log(
    "Section    :",
    testStudent?.section
      ? `${testStudent.section.branch}-${testStudent.section.name}`
      : "N/A"
  );

  console.log("\n=================================");
  console.log("TEST TEACHER");
  console.log("=================================");
  console.log("Name       :", testTeacher?.name);
  console.log("Email      :", testTeacher?.collegeEmail);
  console.log("Teacher ID :", testTeacher?.teacherId);


  // =====================================================
  // FINAL SUMMARY
  // =====================================================

  console.log("\n=================================");
  console.log("DATABASE SEED COMPLETED");
  console.log("=================================");
  console.log("Sections          : 3");
  console.log("Students          : 300");
  console.log("Student emails    : 300");
  console.log("Faculty           : 13");
  console.log("Faculty emails    : 13");
  console.log("Unique Subjects   : 8");
  console.log("Assignments       : 18");
  console.log("Academic Year     : 2026-27");
  console.log("Semester          : 5");
  console.log("=================================\n");
}


// =====================================================
// RUN SEED
// =====================================================

main()
  .catch((error) => {
    console.error("\nSeed failed:");
    console.error(error);

    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });