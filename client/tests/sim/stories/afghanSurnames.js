const names = [
  { name: "Achakzai", ethnicGroup: ["Pashto"] },
  { name: "Afghan", ethnicGroup: ["Dari"] },
  { name: "Afghanzada", ethnicGroup: ["Persian", "Dari"] },
  { name: "Ahmadzai", ethnicGroup: ["Pashto"] },
  { name: "Akhtar", ethnicGroup: ["Urdu", "Indian", "Bengali", "Pashto"] },
  { name: "Alakozai", ethnicGroup: ["Pashto"] },
  {
    name: "Alam",
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
  { name: "Alizai", ethnicGroup: ["Pashto"] },
  { name: "Anwarzai", ethnicGroup: ["Pashto"] },
  { name: "Aurakzai", ethnicGroup: ["Pashto"] },
  { name: "Ayoubi", ethnicGroup: ["Persian", "Pashto", "Arabic"] },
  { name: "Ayubi", ethnicGroup: ["Persian", "Pashto", "Urdu"] },
  { name: "Barakzai", ethnicGroup: ["Pashto"] },
  { name: "Dawlatzai", ethnicGroup: ["Pashto", "Dari"] },
  { name: "Durani", ethnicGroup: ["Pashto"] },
  { name: "Durrani", ethnicGroup: ["Pashto"] },
  {
    name: "Farooq",
    ethnicGroup: ["Urdu", "Indian", "Bengali", "Pashto", "Arabic"]
  },
  {
    name: "Gul",
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
  { name: "Habibzai", ethnicGroup: ["Pashto"] },
  {
    name: "Haider",
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
  { name: "Hasanzai", ethnicGroup: ["Pashto"] },
  { name: "Hassanzai", ethnicGroup: ["Pashto"] },
  { name: "Hussaini", ethnicGroup: ["Persian", "Dari", "Urdu", "Arabic"] },
  { name: "Ibrahimi", ethnicGroup: ["Pashto", "Arabic", "Albanian"] },
  {
    name: "Iqbal",
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
  { name: "Ishaqzai", ethnicGroup: ["Pashto"] },
  {
    name: "Kabir",
    ethnicGroup: [
      "Bengali",
      "Nigerian",
      "Pakistani",
      "Indian",
      "Dari",
      "Persian"
    ]
  },
  { name: "Karzai", ethnicGroup: ["Dari"] },
  {
    name: "Khan",
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
  { name: "Kumaki", ethnicGroup: ["Pashto"] },
  { name: "Malikzai", ethnicGroup: ["Pashto"] },
  {
    name: "Mohammad",
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
  { name: "Mohammadzai", ethnicGroup: ["Pashto"] },
  { name: "Nabizada", ethnicGroup: ["Persian", "Dari"] },
  { name: "Niazai", ethnicGroup: ["Pashto"] },
  {
    name: "Noor",
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
  { name: "Noorzai", ethnicGroup: ["Pashto"] },
  { name: "Nuristani", ethnicGroup: ["Dari"] },
  { name: "Omarzai", ethnicGroup: ["Pashto"] },
  { name: "Orakzai", ethnicGroup: ["Pashto", "Pakistani"] },
  { name: "Pathan", ethnicGroup: ["Indian", "Bengali", "Urdu", "Pashto"] },
  { name: "Popalzai", ethnicGroup: ["Pashto"] },
  { name: "Poya", ethnicGroup: ["Dari"] },
  { name: "Quraishi", ethnicGroup: ["Persian", "Pashto", "Urdu", "Indian"] },
  {
    name: "Qureshi",
    ethnicGroup: ["Sindhi", "Urdu", "Punjabi", "Pashto", "Balochi", "Indian"]
  },
  {
    name: "Rahman",
    ethnicGroup: ["Bengali", "Indian", "Urdu", "Malay", "Pashto", "Arabic"]
  },
  { name: "Rahmanzai", ethnicGroup: ["Pashto"] },
  {
    name: "Rasul",
    ethnicGroup: ["Urdu", "Pashto", "Bengali", "Indian", "Arabic", "Indonesian"]
  },
  {
    name: "Rehman",
    ethnicGroup: ["Urdu", "Punjabi", "Sindhi", "Indian", "Bengali", "Pashto"]
  },
  { name: "Sadozai", ethnicGroup: ["Pashto", "Balochi"] },
  { name: "Safi", ethnicGroup: ["Pashto", "Dari", "Pakistani"] },
  {
    name: "Saleem",
    ethnicGroup: ["Urdu", "Punjabi", "Arabic", "Indian", "Pashto"]
  },
  { name: "Sediqi", ethnicGroup: ["Dari", "Persian"] },
  { name: "Shahnawaz", ethnicGroup: ["Dari"] },
  { name: "Shahzad", ethnicGroup: ["Urdu", "Pashto"] },
  { name: "Sherkhanzai", ethnicGroup: ["Dari"] },
  { name: "Sherzai", ethnicGroup: ["Pashto"] },
  { name: "Shinwari", ethnicGroup: ["Pashto"] },
  { name: "Shirzai", ethnicGroup: ["Pashto"] },
  {
    name: "Siddique",
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
    name: "Siddiqui",
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
  { name: "Sidiqi", ethnicGroup: ["Pashto", "Persian", "Dari"] },
  { name: "Stanikzai", ethnicGroup: ["Pashto"] },
  {
    name: "Ullah",
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
  { name: "Wali", ethnicGroup: ["Urdu", "Pashto", "Bengali", "Arabic"] },
  { name: "Wardak", ethnicGroup: ["Pashto"] },
  { name: "Yousafzai", ethnicGroup: ["Pashto"] },
  { name: "Yousufzai", ethnicGroup: ["Pashto"] },
  { name: "Yusufi", ethnicGroup: ["Dari", "Tajik", "Urdu"] },
  { name: "Yusufzai", ethnicGroup: ["Pashto", "Dari"] },
  { name: "Zadran", ethnicGroup: ["Pashto"] },
  { name: "Zahid", ethnicGroup: ["Urdu", "Punjabi", "Bengali", "Dari"] },
  { name: "Zahir", ethnicGroup: ["Bengali", "Muslim", "Arabic", "Dari"] },
  { name: "Zalmai", ethnicGroup: ["Dari", "Pashto"] },
  { name: "Zazai", ethnicGroup: ["Pashto", "Dari"] }
]
export default names
