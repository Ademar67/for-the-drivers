
import { checkCompatibility } from './checkCompatibility';

const test1 = checkCompatibility({
  oem: 'Toyota WS',
  transmissionType: 'Automatic',
});

console.log('TEST 1');
console.log(test1);

const test2 = checkCompatibility({
  oem: 'Toyota WS',
  transmissionType: 'CVT',
});

console.log('TEST 2');
console.log(test2);

const test3 = checkCompatibility({
  oem: 'DSG',
  transmissionType: 'DSG',
});

console.log('TEST 3');
console.log(test3);

