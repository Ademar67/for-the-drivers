import { recommendFluid } from "./recommendFluid";
const result1 = recommendFluid({ brand: "Toyota", model: "RAV4", year: 2015 });
console.log("RESULTADO 1");
console.log(result1);
const result2 = recommendFluid({
  brand: "Volkswagen",
  model: "Golf GTI",
  year: 2018,
});
console.log("RESULTADO 2");
console.log(result2);
const result3 = recommendFluid({
  brand: "Nissan",
  model: "Sentra",
  year: 2017,
});
console.log("RESULTADO 3");
console.log(result3);
