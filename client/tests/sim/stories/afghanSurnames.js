const names = [
  { name: "ACHAKZAI", ethnicGroup: ["Pashto"] },
  { name: "AFGHAN", ethnicGroup: ["Dari"] },
  { name: "AFGHANZADA", ethnicGroup: ["Persian", "Dari"] },
  { name: "AHMADZAI", ethnicGroup: ["Pashto"] },
  { name: "AKHTAR", ethnicGroup: ["Urdu", "Indian", "Bengali", "Pashto"] },
  { name: "ALAKOZAI", ethnicGroup: ["Pashto"] },
  {
    name: "ALAM",
    ethnicGroup: [
      "Bengali",
      "Indian",
      "Hindi",
      "Pakistani",
      "Urdu",
      "Arabic",
      "Indonesian",
      "Dari"
    ]
  },
  { name: "ALIZAI", ethnicGroup: ["Pashto"] },
  { name: "ANWARZAI", ethnicGroup: ["Pashto"] },
  { name: "AURAKZAI", ethnicGroup: ["Pashto"] },
  { name: "AYOUBI", ethnicGroup: ["Persian", "Pashto", "Arabic"] },
  { name: "AYUBI", ethnicGroup: ["Persian", "Pashto", "Urdu"] },
  { name: "BARAKZAI", ethnicGroup: ["Pashto"] },
  { name: "DAWLATZAI", ethnicGroup: ["Pashto", "Dari"] },
  { name: "DURANI", ethnicGroup: ["Pashto"] },
  { name: "DURRANI", ethnicGroup: ["Pashto"] },
  {
    name: "FAROOQ",
    ethnicGroup: ["Urdu", "Indian", "Bengali", "Pashto", "Arabic"]
  },
  {
    name: "GUL",
    ethnicGroup: [
      "Pakistani",
      "Pashto",
      "Punjabi",
      "Sindhi",
      "Balochi",
      "Urdu",
      "Persian"
    ]
  },
  { name: "HABIBZAI", ethnicGroup: ["Pashto"] },
  {
    name: "HAIDER",
    ethnicGroup: [
      "Urdu",
      "Punjabi",
      "Sindhi",
      "Pashto",
      "Balochi",
      "Bengali",
      "Arabic"
    ]
  },
  { name: "HASANZAI", ethnicGroup: ["Pashto"] },
  { name: "HASSANZAI", ethnicGroup: ["Pashto"] },
  { name: "HUSSAINI", ethnicGroup: ["Persian", "Dari", "Urdu", "Arabic"] },
  { name: "IBRAHIMI", ethnicGroup: ["Pashto", "Arabic", "Albanian"] },
  {
    name: "IQBAL",
    ethnicGroup: [
      "Urdu",
      "Bengali",
      "Indian",
      "Punjabi",
      "Kashmiri",
      "Arabic",
      "Pashto",
      "Indonesian"
    ]
  },
  { name: "ISHAQZAI", ethnicGroup: ["Pashto"] },
  {
    name: "KABIR",
    ethnicGroup: [
      "Bengali",
      "Nigerian",
      "Pakistani",
      "Indian",
      "Dari",
      "Persian"
    ]
  },
  { name: "KARZAI", ethnicGroup: ["Dari"] },
  {
    name: "KHAN",
    ethnicGroup: [
      "Punjabi",
      "Pashto",
      "Sindhi",
      "Balochi",
      "Urdu",
      "Kashmiri",
      "Indian",
      "Bengali"
    ]
  },
  { name: "KUMAKI", ethnicGroup: ["Pashto"] },
  { name: "MALIKZAI", ethnicGroup: ["Pashto"] },
  {
    name: "MOHAMMAD",
    ethnicGroup: [
      "Indian",
      "Bengali",
      "Urdu",
      "Arabic",
      "Persian",
      "Pashto",
      "Punjabi"
    ]
  },
  { name: "MOHAMMADZAI", ethnicGroup: ["Pashto"] },
  { name: "NABIZADA", ethnicGroup: ["Persian", "Dari"] },
  { name: "NIAZAI", ethnicGroup: ["Pashto"] },
  {
    name: "NOOR",
    ethnicGroup: [
      "Pakistani",
      "Urdu",
      "Bengali",
      "Punjabi",
      "Malay",
      "Pashto",
      "Arabic",
      "Indian",
      "Muslim"
    ]
  },
  { name: "NOORZAI", ethnicGroup: ["Pashto"] },
  { name: "NURISTANI", ethnicGroup: ["Dari"] },
  { name: "OMARZAI", ethnicGroup: ["Pashto"] },
  { name: "ORAKZAI", ethnicGroup: ["Pashto", "Pakistani"] },
  { name: "PATHAN", ethnicGroup: ["Indian", "Bengali", "Urdu", "Pashto"] },
  { name: "POPALZAI", ethnicGroup: ["Pashto"] },
  { name: "POYA", ethnicGroup: ["Dari"] },
  { name: "QURAISHI", ethnicGroup: ["Persian", "Pashto", "Urdu", "Indian"] },
  {
    name: "QURESHI",
    ethnicGroup: ["Sindhi", "Urdu", "Punjabi", "Pashto", "Balochi", "Indian"]
  },
  {
    name: "RAHMAN",
    ethnicGroup: ["Bengali", "Indian", "Urdu", "Malay", "Pashto", "Arabic"]
  },
  { name: "RAHMANZAI", ethnicGroup: ["Pashto"] },
  {
    name: "RASUL",
    ethnicGroup: ["Urdu", "Pashto", "Bengali", "Indian", "Arabic", "Indonesian"]
  },
  {
    name: "REHMAN",
    ethnicGroup: ["Urdu", "Punjabi", "Sindhi", "Indian", "Bengali", "Pashto"]
  },
  { name: "SADOZAI", ethnicGroup: ["Pashto", "Balochi"] },
  { name: "SAFI", ethnicGroup: ["Pashto", "Dari", "Pakistani"] },
  {
    name: "SALEEM",
    ethnicGroup: ["Urdu", "Punjabi", "Arabic", "Indian", "Pashto"]
  },
  { name: "SEDIQI", ethnicGroup: ["Dari", "Persian"] },
  { name: "SHAHNAWAZ", ethnicGroup: ["Dari"] },
  { name: "SHAHZAD", ethnicGroup: ["Urdu", "Pashto"] },
  { name: "SHERKHANZAI", ethnicGroup: ["Dari"] },
  { name: "SHERZAI", ethnicGroup: ["Pashto"] },
  { name: "SHINWARI", ethnicGroup: ["Pashto"] },
  { name: "SHIRZAI", ethnicGroup: ["Pashto"] },
  {
    name: "SIDDIQUE",
    ethnicGroup: [
      "Punjabi",
      "Urdu",
      "Sindhi",
      "Pashto",
      "Balochi",
      "Bengali",
      "Indian"
    ]
  },
  {
    name: "SIDDIQUI",
    ethnicGroup: [
      "Urdu",
      "Sindhi",
      "Punjabi",
      "Balochi",
      "Pashto",
      "Bengali",
      "Indian"
    ]
  },
  { name: "SIDIQI", ethnicGroup: ["Pashto", "Persian", "Dari"] },
  { name: "STANIKZAI", ethnicGroup: ["Pashto"] },
  {
    name: "ULLAH",
    ethnicGroup: [
      "Pakistani",
      "Pashto",
      "Urdu",
      "Punjabi",
      "Balochi",
      "Sindhi",
      "Bengali",
      "Indian"
    ]
  },
  { name: "WALI", ethnicGroup: ["Urdu", "Pashto", "Bengali", "Arabic"] },
  { name: "WARDAK", ethnicGroup: ["Pashto"] },
  { name: "YOUSAFZAI", ethnicGroup: ["Pashto"] },
  { name: "YOUSUFZAI", ethnicGroup: ["Pashto"] },
  { name: "YUSUFI", ethnicGroup: ["Dari", "Tajik", "Urdu"] },
  { name: "YUSUFZAI", ethnicGroup: ["Pashto", "Dari"] },
  { name: "ZADRAN", ethnicGroup: ["Pashto"] },
  { name: "ZAHID", ethnicGroup: ["Urdu", "Punjabi", "Bengali", "Dari"] },
  { name: "ZAHIR", ethnicGroup: ["Bengali", "Muslim", "Arabic", "Dari"] },
  { name: "ZALMAI", ethnicGroup: ["Dari", "Pashto"] },
  { name: "ZAZAI", ethnicGroup: ["Pashto", "Dari"] }
]
export default names
