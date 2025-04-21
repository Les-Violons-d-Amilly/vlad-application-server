# BACKEND REST API

## **Tools**

- Language : _TypeScript_
- Framework : _express_
- Database : _MongoDB_

## DataBase Structure

_Note: This structure is subject to change in future updates._

Teacher -> Students -> Exercises

**Teacher**

- firstName: string;
- lastName: string;
- email: string;
- student?: StudentDocument[];

**Student**

- firstName: string;
- lastName: string;
- email: string;
- age: number;
- sex: string;
- exercises?: ExerciseDocument[];

**Exercise**

- name: string;
- globalScore?: number;
- noteReading?: string;
- numberOfErrors?: number;
- reactionTime?: number;
- errorDetails?: string[];
- date: Date;-
