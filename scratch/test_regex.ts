const closeSlice = "Sekretaris : Dr. H. ";
console.log(/:\s*[a-zA-Z.\s<>]*$/.test(closeSlice));

const closeSlice2 = "Sekretaris,</div> <div>Dr. H. ";
console.log(/:\s*[a-zA-Z.\s<>]*$/.test(closeSlice2));
