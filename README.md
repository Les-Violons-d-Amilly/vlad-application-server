# BACKEND REST API

## **Tools**

- Language : _TypeScript_
- Framework : _express_
- Database : _MongoDB_

## DataBase Structure

_Note: This structure is subject to change in future updates._

Teacher -> Groups -> Students -> Exercises

Teacher

- firstName: string
- lastName: string
- email: string
- groups: Group[]

Group

- name: string
- students: Student[]

Student

- firstName: string
- lastName: string
- email: string
- exercises: Exercise[]
