const BASE_PRICE = 1000;
const ADDITIONAL_STUDENT_PRICE = 500;
const ADDITIONAL_TEACHER_PRICE = 1000;

export default function calculatePrice(
  studentsCount: number,
  teachersCount: number
): number {
  let totalPrice = BASE_PRICE;

  if (studentsCount > 0) {
    totalPrice += (studentsCount - 1) * ADDITIONAL_STUDENT_PRICE;
  }

  if (teachersCount > 0) {
    totalPrice += (teachersCount - 1) * ADDITIONAL_TEACHER_PRICE;
  }

  return totalPrice;
}
