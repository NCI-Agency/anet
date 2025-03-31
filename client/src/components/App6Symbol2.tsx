import ms from "milsymbol"
import React from "react"

const VERSION = 100

const SymbolSetChoices = {
  "01": "Air",
  "02": "Air missile",
  "05": "Space",
  "06": "Space Missile",
  10: "Land unit",
  11: "Land civilian unit / Organization",
  15: "Land equipment",
  20: "Land installations",
  // 25: "Control measure",
  27: "Dismounted individual",
  30: "Sea surface",
  35: "Sea subsurface",
  36: "Mine warfare",
  40: "Activity / Event",
  50: "Signals Intelligence - Space",
  51: "Signals Intelligence - Air",
  52: "Signals Intelligence - Land",
  53: "Signals Intelligence - Surface",
  54: "Signals Intelligence - Subsurface",
  60: "Cyberspace"
}

const AffiliationChoices = {
  0: "Pending",
  1: "Unknown",
  3: "Friend",
  4: "Neutral",
  6: "Hostile"
}

const StatusChoices = {
  0: "Present",
  1: "Planned / Anticipated / Suspect",
  2: "Present / Fully capable",
  3: "Present / Damaged",
  4: "Present / Destroyed",
  5: "Present / Full to capacity"
}

const HqChoices = {
  0: "Not Applicable",
  1: "Feint / Dummy",
  2: "Headquarters",
  3: "Feint / Dummy Headquarters",
  4: "Task Force",
  5: "Feint / Dummy Task Force",
  6: "Task Force Headquarters",
  7: "Feint / Dummy Task Force Headquarters"
}

const EchilonChoices = {
  10: {
    "00": "Unspecified",
    11: "Team / Crew",
    12: "Squad",
    13: "Section",
    14: "Platoon / Detachment",
    15: "Company / Battery / Troop",
    16: "Battalion / Squadron",
    17: "Regiment / Group",
    18: "Brigade",
    21: "Division",
    22: "Corps / MEF",
    23: "Army",
    24: "Army Group / Front",
    25: "Region / Theater",
    26: "Command"
  },
  15: {
    "00": "Unspecified",
    31: "Wheeled limited cross country",
    32: "Wheeled cross country",
    33: "Tracked",
    34: "Wheeled and tracked combination",
    35: "Towed",
    36: "Railway",
    37: "Pack animals",
    41: "Over snow (prime mover)",
    42: "Sled",
    51: "Barge",
    52: "Amphibious"
  },
  27: {
    "00": "Unspecified",
    71: "Leader"
  },
  30: {
    "00": "Unspecified",
    61: "Short towed array",
    62: "Long towed array"
  },
  35: {
    "00": "Unspecified",
    61: "Short towed array",
    62: "Long towed array"
  }
}

const MainIconChoices = {
  "01": {
    "000000": { value: "Unspecified" },
    110000: { value: "Military" },
    110100: { value: "Fixed Wing", category: "Military" },
    110101: {
      value: "Medical Evacuation (MEDEVAC)",
      category: "Military - Fixed Wing"
    },
    110102: { value: "Attack / Strike", category: "Military - Fixed Wing" },
    110103: { value: "Bomber", category: "Military - Fixed Wing" },
    110104: { value: "Fighter", category: "Military - Fixed Wing" },
    110105: { value: "Fighter / Bomber", category: "Military - Fixed Wing" },
    110106: {
      value: "{reserved for future use}",
      category: "Military - Fixed Wing"
    },
    110107: { value: "Cargo", category: "Military - Fixed Wing" },
    110108: {
      value: "Electronic Combat (EC) / Jammer",
      category: "Military - Fixed Wing"
    },
    110109: { value: "Tanker", category: "Military - Fixed Wing" },
    110110: { value: "Patrol", category: "Military - Fixed Wing" },
    110111: { value: "Reconnaissance", category: "Military - Fixed Wing" },
    110112: { value: "Trainer", category: "Military - Fixed Wing" },
    110113: { value: "Utility", category: "Military - Fixed Wing" },
    110114: {
      value: "Vertical or Short Take-off and Landing (VSTOL)",
      category: "Military - Fixed Wing"
    },
    110115: {
      value: "Airborne Command Post (ACP)",
      category: "Military - Fixed Wing"
    },
    110116: {
      value: "Airborne Early Warning (AEW)",
      category: "Military - Fixed Wing"
    },
    110117: {
      value: "Antisurface Warfare",
      category: "Military - Fixed Wing"
    },
    110118: {
      value: "Antisubmarine Warfare",
      category: "Military - Fixed Wing"
    },
    110119: { value: "Communications", category: "Military - Fixed Wing" },
    110120: {
      value: "Combat Search and Rescue (CSAR)",
      category: "Military - Fixed Wing"
    },
    110121: {
      value: "Electronic Support Measures(ESM)",
      category: "Military - Fixed Wing"
    },
    110122: { value: "Government", category: "Military - Fixed Wing" },
    110123: {
      value: "Mine Countermeasures (MCM)",
      category: "Military - Fixed Wing"
    },
    110124: {
      value: "Personnel Recovery",
      category: "Military - Fixed Wing"
    },
    110125: { value: "Search and Rescue", category: "Military - Fixed Wing" },
    110126: {
      value: "Special Operations Forces",
      category: "Military - Fixed Wing"
    },
    110127: { value: "Ultra Light", category: "Military - Fixed Wing" },
    110128: {
      value: "Photographic Reconnaissance",
      category: "Military - Fixed Wing"
    },
    110129: {
      value: "Very Important Person (VIP)",
      category: "Military - Fixed Wing"
    },
    110130: {
      value: "Suppression of Enemy Air Defence",
      category: "Military - Fixed Wing"
    },
    110131: { value: "Passenger", category: "Military - Fixed Wing" },
    110132: { value: "Escort", category: "Military - Fixed Wing" },
    110133: {
      value: "Electronic Attack (EA)",
      category: "Military - Fixed Wing"
    },
    110200: { value: "Rotary Wing", category: "Military" },
    110300: {
      value:
        "Unmanned Aircraft (UA)  /  Unmanned Aerial Vehicle (UAV)  /  Unmanned Aircraft System (UAS)  /  Remotely Piloted Vehicle (RPV)",
      category: "Military"
    },
    110400: { value: "Vertical Take-off UAV (VT-UAV)", category: "Military" },
    110500: { value: "Lighter Than Air", category: "Military" },
    110600: { value: "Airship", category: "Military" },
    110700: { value: "Tethered Lighter than Air", category: "Military" },
    120000: { value: "Civilian" },
    120100: { value: "Fixed Wing", category: "Civilian" },
    120200: { value: "Rotary Wing", category: "Civilian" },
    120300: {
      value:
        "Unmanned Aircraft (UA)  /  Unmanned Aerial Vehicle (UAV)  /  Unmanned Aircraft System (UAS)  /  Remotely Piloted Vehicle (RPV)",
      category: "Civilian"
    },
    120400: { value: "Lighter Than Air", category: "Civilian" },
    120500: { value: "Airship", category: "Civilian" },
    120600: { value: "Tethered Lighter than Air", category: "Civilian" },
    130000: { value: "Weapon" },
    130100: { value: "Bomb", category: "Weapon" },
    130200: { value: "Decoy", category: "Weapon" },
    140000: { value: "Manual Track" }
  },
  "02": {
    "000000": { value: "Unspecified" },
    110000: { value: "Missile" }
  },
  "05": {
    "000000": { value: "Unspecified" },
    110000: { value: "Military" },
    110100: { value: "Space Vehicle", category: "Military" },
    110200: { value: "Re-Entry Vehicle", category: "Military" },
    110300: { value: "Planet Lander", category: "Military" },
    110400: { value: "Orbiter Shuttle", category: "Military" },
    110500: { value: "Capsule", category: "Military" },
    110600: { value: "Satellite, General", category: "Military" },
    110700: { value: "Satellite", category: "Military" },
    110800: { value: "Antisatellite Weapon", category: "Military" },
    110900: { value: "Astronomical Satellite", category: "Military" },
    111000: { value: "Biosatellite", category: "Military" },
    111100: { value: "Communications Satellite", category: "Military" },
    111200: { value: "Earth Observation Satellite", category: "Military" },
    111300: { value: "Miniaturized Satellite", category: "Military" },
    111400: { value: "Navigational Satellite", category: "Military" },
    111500: { value: "Reconnaissance Satellite", category: "Military" },
    111600: { value: "Space Station", category: "Military" },
    111700: { value: "Tethered Satellite", category: "Military" },
    111800: { value: "Weather Satellite", category: "Military" },
    111900: { value: "Space Launched Vehicle (SLV)", category: "Military" },
    120000: { value: "Civilian" },
    120100: { value: "Orbiter Shuttle", category: "Civilian" },
    120200: { value: "Capsule", category: "Civilian" },
    120300: { value: "Satellite", category: "Civilian" },
    120400: { value: "Astronomical Satellite", category: "Civilian" },
    120500: { value: "Biosatellite", category: "Civilian" },
    120600: { value: "Communications Satellite", category: "Civilian" },
    120700: { value: "Earth Observation Satellite", category: "Civilian" },
    120800: { value: "Miniaturized Satellite", category: "Civilian" },
    120900: { value: "Navigational Satellite", category: "Civilian" },
    121000: { value: "Space Station", category: "Civilian" },
    121100: { value: "Tethered Satellite", category: "Civilian" },
    121200: { value: "Weather Satellite", category: "Civilian" },
    130000: { value: "Manual Track" }
  },
  "06": {
    "000000": { value: "Unspecified" },
    110000: { value: "Missile" }
  },
  10: {
    "000000": { value: "Unspecified" },
    110000: { value: "Command and Control" },
    110100: {
      category: "Command and Control",
      value: "Broadcast Transmitter Antennae"
    },
    110200: { category: "Command and Control", value: "Civil Affairs" },
    110300: {
      category: "Command and Control",
      value: "Civil-Military Cooperation"
    },
    110400: {
      category: "Command and Control",
      value: "Information Operations"
    },
    110500: { category: "Command and Control", value: "Liaison" },
    110501: {
      category: "Command and Control - Liaison",
      value: "Reconnaissance and Liaison Element"
    },
    110600: {
      category: "Command and Control",
      value: "Psychological Operations (PSYOPS)"
    },
    110601: {
      category: "Command and Control - Psychological Operations (PSYOPS)",
      value: "Broadcast Transmitter Antennae"
    },
    110700: { category: "Command and Control", value: "Radio" },
    110800: { category: "Command and Control", value: "Radio Relay" },
    110900: {
      category: "Command and Control",
      value: "Radio Teletype Centre"
    },
    111000: { category: "Command and Control", value: "Signal" },
    111001: { category: "Command and Control - Signal", value: "Radio" },
    111002: {
      category: "Command and Control - Signal",
      value: "Radio Relay"
    },
    111003: { category: "Command and Control - Signal", value: "Teletype" },
    111004: {
      category: "Command and Control - Signal",
      value: "Tactical Satellite"
    },
    111005: {
      category: "Command and Control - Signal",
      value: "Video Imagery (Combat Camera)"
    },
    111100: { category: "Command and Control", value: "Tactical Satellite" },
    111200: {
      category: "Command and Control",
      value: "Video Imagery (Combat Camera)"
    },
    120000: { value: "Movement and Manoeuvre" },
    120100: {
      category: "Movement and Manoeuvre",
      value: "Air Assault with Organic Lift"
    },
    120200: {
      category: "Movement and Manoeuvre",
      value: "Air Traffic Services  /  Airfield Operations"
    },
    120300: { category: "Movement and Manoeuvre", value: "Amphibious" },
    120400: {
      category: "Movement and Manoeuvre",
      value: "Antitank  /  Antiarmour"
    },
    120401: {
      category: "Movement and Manoeuvre - Antitank  /  Antiarmour",
      value: "Armoured"
    },
    120402: {
      category: "Movement and Manoeuvre - Antitank  /  Antiarmour",
      value: "Motorized"
    },
    120500: {
      category: "Movement and Manoeuvre",
      value:
        "Armour  /  Armoured  /  Mechanized  /  Self-Propelled  /   Tracked"
    },
    120501: {
      category:
        "Movement and Manoeuvre - Armour  /  Armoured  /  Mechanized  /  Self-Propelled  /   Tracked",
      value: "Reconnaissance  /  Cavalry  /  Scout"
    },
    120502: {
      category:
        "Movement and Manoeuvre - Armour  /  Armoured  /  Mechanized  /  Self-Propelled  /   Tracked",
      value: "Amphibious"
    },
    120600: {
      category: "Movement and Manoeuvre",
      value: "Army Aviation  /  Aviation Rotary Wing"
    },
    120601: {
      category:
        "Movement and Manoeuvre - Army Aviation  /  Aviation Rotary Wing",
      value: "Reconnaissance"
    },
    120700: {
      category: "Movement and Manoeuvre",
      value: "Aviation Composite"
    },
    120800: {
      category: "Movement and Manoeuvre",
      value: "Aviation Fixed Wing"
    },
    120801: {
      category: "Movement and Manoeuvre - Aviation Fixed Wing",
      value: "Reconnaissance"
    },
    120900: { category: "Movement and Manoeuvre", value: "Combat" },
    121000: { category: "Movement and Manoeuvre", value: "Combined Arms" },
    121100: { category: "Movement and Manoeuvre", value: "Infantry" },
    121101: {
      category: "Movement and Manoeuvre - Infantry",
      value: "Amphibious"
    },
    121102: {
      category: "Movement and Manoeuvre - Infantry",
      value: "Armoured  /  Mechanized  /  Tracked"
    },
    121103: {
      category: "Movement and Manoeuvre - Infantry",
      value: "Main Gun System"
    },
    121104: {
      category: "Movement and Manoeuvre - Infantry",
      value: "Motorized"
    },
    121105: {
      category: "Movement and Manoeuvre - Infantry",
      value: "Mechanised Infantry with Main Gun System"
    },
    121106: {
      category: "Movement and Manoeuvre - Infantry",
      value: "Main Gun System  /  Heavy Weapon"
    },
    121200: { category: "Movement and Manoeuvre", value: "Observer" },
    121300: {
      category: "Movement and Manoeuvre",
      value: "Reconnaissance  /  Cavalry  /  Scout"
    },
    121301: {
      category: "Movement and Manoeuvre - Reconnaissance  /  Cavalry  /  Scout",
      value: "Reconnaissance and Surveillance"
    },
    121302: {
      category: "Movement and Manoeuvre - Reconnaissance  /  Cavalry  /  Scout",
      value: "Marine"
    },
    121303: {
      category: "Movement and Manoeuvre - Reconnaissance  /  Cavalry  /  Scout",
      value: "Motorized"
    },
    121400: {
      category: "Movement and Manoeuvre",
      value: "Sea Air Land (SEAL)"
    },
    121500: { category: "Movement and Manoeuvre", value: "Sniper" },
    121600: { category: "Movement and Manoeuvre", value: "Surveillance" },
    121700: { category: "Movement and Manoeuvre", value: "Special Forces" },
    121800: {
      category: "Movement and Manoeuvre",
      value: "Special Operations Forces (SOF)"
    },
    121801: {
      category: "Movement and Manoeuvre - Special Operations Forces (SOF)",
      value: "Fixed Wing PSYOPS"
    },
    121802: {
      category: "Movement and Manoeuvre - Special Operations Forces (SOF)",
      value: "Ground"
    },
    121803: {
      category: "Movement and Manoeuvre - Special Operations Forces (SOF)",
      value: "Special Boat"
    },
    121804: {
      category: "Movement and Manoeuvre - Special Operations Forces (SOF)",
      value: "Special SSNR"
    },
    121805: {
      category: "Movement and Manoeuvre - Special Operations Forces (SOF)",
      value: "Underwater Demolition Team"
    },
    121900: {
      category: "Movement and Manoeuvre",
      value: "Unmanned Aerial Systems"
    },
    130000: { value: "Fires" },
    130100: { category: "Fires", value: "Air Defence" },
    130101: { category: "Fires - Air Defence", value: "Main Gun System" },
    130102: { category: "Fires - Air Defence", value: "Missile" },
    130200: {
      category: "Fires",
      value: "Air  /  Land Naval Gunfire Liaison"
    },
    130300: { category: "Fires", value: "Field Artillery" },
    130301: { category: "Fires - Field Artillery", value: "Self-propelled" },
    130302: {
      category: "Fires - Field Artillery",
      value: "Target Acquisition"
    },
    130303: { category: "Fires - Field Artillery", value: "Reconnaissance" },
    130400: { category: "Fires", value: "Field Artillery Observer" },
    130500: { category: "Fires", value: "Joint Fire Support" },
    130600: { category: "Fires", value: "Meteorological" },
    130700: { category: "Fires", value: "Missile" },
    130800: { category: "Fires", value: "Mortar" },
    130801: {
      category: "Fires - Mortar",
      value: "Armoured  /  Mechanized  /   Tracked"
    },
    130802: { category: "Fires - Mortar", value: "Self-Propelled Wheeled" },
    130803: { category: "Fires - Mortar", value: "Towed" },
    130900: { category: "Fires", value: "Survey" },
    140000: { value: "Protection" },
    140100: {
      category: "Protection",
      value: "Chemical Biological Radiological Nuclear Defence"
    },
    140101: {
      category: "Protection - Chemical Biological Radiological Nuclear Defence",
      value: "Mechanized"
    },
    140102: {
      category: "Protection - Chemical Biological Radiological Nuclear Defence",
      value: "Motorized"
    },
    140103: {
      category: "Protection - Chemical Biological Radiological Nuclear Defence",
      value: "Reconnaissance"
    },
    140104: {
      category: "Protection - Chemical Biological Radiological Nuclear Defence",
      value: "Reconnaissance Armoured"
    },
    140105: {
      category: "Protection - Chemical Biological Radiological Nuclear Defence",
      value: "Reconnaissance Equipped"
    },
    140200: {
      category: "Protection",
      value: "Combat Support (Manoeuvre Enhancement)"
    },
    140300: {
      category: "Protection",
      value: "Criminal Investigation Division"
    },
    140400: { category: "Protection", value: "Diving" },
    140500: { category: "Protection", value: "Dog" },
    140600: { category: "Protection", value: "Drilling" },
    140700: { category: "Protection", value: "Engineer" },
    140701: { category: "Protection - Engineer", value: "Mechanized" },
    140702: { category: "Protection - Engineer", value: "Motorized" },
    140703: { category: "Protection - Engineer", value: "Reconnaissance" },
    140800: {
      category: "Protection",
      value: "Explosive Ordnance Disposal (EOD)"
    },
    140900: { category: "Protection", value: "Field Camp Construction" },
    141000: {
      category: "Protection",
      value: "Fire Fighting  /  Fire Protection"
    },
    141100: {
      category: "Protection",
      value: "Geospatial Support  /  Geospatial Information Support"
    },
    141200: { category: "Protection", value: "Military Police" },
    141300: { category: "Protection", value: "Mine" },
    141400: { category: "Protection", value: "Mine Clearing" },
    141500: { category: "Protection", value: "Mine Launching" },
    141600: { category: "Protection", value: "Mine Laying" },
    141700: { category: "Protection", value: "Security" },
    141701: { category: "Protection - Security", value: "Mechanized" },
    141702: { category: "Protection - Security", value: "Motorized" },
    141800: { category: "Protection", value: "Search and Rescue" },
    141900: { category: "Protection", value: "Security Police (Air)" },
    142000: { category: "Protection", value: "Shore Patrol" },
    142100: { category: "Protection", value: "Topographic" },
    150000: { value: "Intelligence" },
    150100: { category: "Intelligence", value: "Analysis" },
    150200: { category: "Intelligence", value: "Counterintelligence" },
    150300: { category: "Intelligence", value: "Direction Finding" },
    150400: { category: "Intelligence", value: "Electronic Ranging" },
    150500: { category: "Intelligence", value: "Electronic Warfare" },
    150501: {
      category: "Intelligence - Electronic Warfare",
      value: "Analysis"
    },
    150502: {
      category: "Intelligence - Electronic Warfare",
      value: "Direction Finding"
    },
    150503: {
      category: "Intelligence - Electronic Warfare",
      value: "Intercept"
    },
    150504: {
      category: "Intelligence - Electronic Warfare",
      value: "Jamming"
    },
    150505: {
      category: "Intelligence - Electronic Warfare",
      value: "Search"
    },
    150600: {
      category: "Intelligence",
      value: "Intercept (Search and Recording)"
    },
    150700: { category: "Intelligence", value: "Interrogation" },
    150800: { category: "Intelligence", value: "Jamming" },
    150900: { category: "Intelligence", value: "Joint Intelligence Centre" },
    151000: { category: "Intelligence", value: "Military Intelligence" },
    151100: { category: "Intelligence", value: "Search" },
    151200: { category: "Intelligence", value: "Sensor" },
    160000: { value: "Sustainment" },
    160100: { category: "Sustainment", value: "Administrative" },
    160200: { category: "Sustainment", value: "All Classes of Supply" },
    160300: {
      category: "Sustainment",
      value: "Airport of Debarkation  /  Airport of Embarkation"
    },
    160400: { category: "Sustainment", value: "Ammunition" },
    160500: { category: "Sustainment", value: "Band" },
    160501: { category: "Sustainment - Band", value: "Army Music" },
    160600: { category: "Sustainment", value: "Combat Service Support" },
    160700: { category: "Sustainment", value: "Finance" },
    160800: { category: "Sustainment", value: "Judge Advocate General" },
    160900: { category: "Sustainment", value: "Labour" },
    161000: { category: "Sustainment", value: "Laundry  /  Bath" },
    161100: { category: "Sustainment", value: "Maintenance" },
    161200: { category: "Sustainment", value: "Material" },
    161300: { category: "Sustainment", value: "Medical" },
    161400: { category: "Sustainment", value: "Medical Treatment Facility" },
    161500: {
      category: "Sustainment",
      value: "Morale, Welfare and Recreation"
    },
    161600: {
      category: "Sustainment",
      value: "Mortuary Affairs  /  Graves Registration"
    },
    161700: { category: "Sustainment", value: "Multiple Classes of Supply" },
    161800: { category: "Sustainment", value: "NATO Supply Class I" },
    161900: { category: "Sustainment", value: "NATO Supply Class II" },
    162000: { category: "Sustainment", value: "NATO Supply Class III" },
    162100: { category: "Sustainment", value: "NATO Supply Class IV" },
    162200: { category: "Sustainment", value: "NATO Supply Class V" },
    162300: { category: "Sustainment", value: "Ordnance" },
    162400: { category: "Sustainment", value: "Personnel Services" },
    162500: {
      category: "Sustainment",
      value: "Petroleum, Oil and Lubricants"
    },
    162600: { category: "Sustainment", value: "Pipeline" },
    162700: { category: "Sustainment", value: "Postal" },
    162800: {
      category: "Sustainment",
      value: "Public Affairs  /  Public Information"
    },
    162900: { category: "Sustainment", value: "Quartermaster" },
    163000: { category: "Sustainment", value: "Railhead" },
    163100: { category: "Sustainment", value: "Religious Support" },
    163200: { category: "Sustainment", value: "Replacement Holding Unit" },
    163300: {
      category: "Sustainment",
      value: "Seaport of Debarkation  /  Seaport of Embarkation"
    },
    163400: { category: "Sustainment", value: "Supply" },
    163500: { category: "Sustainment", value: "Joint Information Bureau" },
    163600: { category: "Sustainment", value: "Transportation" },
    163700: { category: "Sustainment", value: "US Supply Class I" },
    163800: { category: "Sustainment", value: "US Supply Class II" },
    163900: { category: "Sustainment", value: "US Supply Class III" },
    164000: { category: "Sustainment", value: "US Supply Class IV" },
    164100: { category: "Sustainment", value: "US Supply Class V" },
    164200: { category: "Sustainment", value: "US Supply Class VI" },
    164300: { category: "Sustainment", value: "US Supply Class VII" },
    164400: { category: "Sustainment", value: "US Supply Class VIII" },
    164500: { category: "Sustainment", value: "US Supply Class IX" },
    164600: { category: "Sustainment", value: "US Supply Class X" },
    164700: { category: "Sustainment", value: "Water" },
    164800: { category: "Sustainment", value: "Water Purification" },
    164900: { category: "Sustainment", value: "Broadcast" },
    170000: { value: "Naval" },
    170100: { category: "Naval", value: "Naval" },
    180000: { value: "Named Headquarters" },
    180100: {
      category: "Named Headquarters",
      value: "Allied Command Europe Rapid Reaction Corps (ARRC)"
    },
    180200: {
      category: "Named Headquarters",
      value: "Allied Command Operations"
    },
    180300: {
      category: "Named Headquarters",
      value: "International Security Assistance Force (ISAF)"
    },
    180400: { category: "Named Headquarters", value: "Multinational (MN)" },
    190000: { value: "Emergency Operation" },
    200000: { value: "Law Enforcement" },
    200100: {
      category: "Law Enforcement",
      value:
        "Bureau of Alcohol, Tobacco, Firearms and Explosives (ATF) (Department of Justice)"
    },
    200200: { category: "Law Enforcement", value: "Border Patrol" },
    200300: { category: "Law Enforcement", value: "Customs Service" },
    200400: {
      category: "Law Enforcement",
      value: "Drug Enforcement Administration (DEA)"
    },
    200500: {
      category: "Law Enforcement",
      value: "Department of Justice (DOJ)"
    },
    200600: {
      category: "Law Enforcement",
      value: "Federal Bureau of Investigation (FBI)"
    },
    200700: { category: "Law Enforcement", value: "Police" },
    200800: { category: "Law Enforcement", value: "Prison" },
    200900: {
      category: "Law Enforcement",
      value: "United States Secret Service (USSS)"
    },
    201000: {
      category: "Law Enforcement",
      value: "Transportation Security Administration (TSA)"
    },
    201100: { category: "Law Enforcement", value: "Coast Guard" },
    201200: { category: "Law Enforcement", value: "US Marshals Service" },
    201300: { category: "Law Enforcement", value: "Internal Security Force" }
  },
  11: {
    "000000": { value: "Unspecified" },
    110000: { value: "Civilian" },
    110100: { category: "Civilian", value: "Environmental Protection" },
    110200: { category: "Civilian", value: "Government Organization" },
    110300: { category: "Civilian", value: "Individual" },
    110400: { category: "Civilian", value: "Organization or Group" },
    110500: { category: "Civilian", value: "Killing Victim" },
    110600: { category: "Civilian", value: "Killing Victims" },
    110700: { category: "Civilian", value: "Victim of an Attempted Crime" },
    110800: { category: "Civilian", value: "Spy" },
    110900: { category: "Civilian", value: "Composite Loss" },
    111000: { category: "Civilian", value: "Emergency Medical Operation" }
  },
  15: {
    "000000": { value: "Unspecified" },
    110000: { value: "Weapons / Weapons System" },
    110100: { category: "Weapons / Weapons System", value: "Rifle" },
    110101: {
      category: "Weapons / Weapons System - Rifle",
      value: "Single Shot Rifle"
    },
    110102: {
      category: "Weapons / Weapons System - Rifle",
      value: "Semiautomatic Rifle"
    },
    110103: {
      category: "Weapons / Weapons System - Rifle",
      value: "Automatic Rifle"
    },
    110200: { category: "Weapons / Weapons System", value: "Machine Gun" },
    110201: {
      category: "Weapons / Weapons System - Machine Gun",
      value: "Light"
    },
    110202: {
      category: "Weapons / Weapons System - Machine Gun",
      value: "Medium"
    },
    110203: {
      category: "Weapons / Weapons System - Machine Gun",
      value: "Heavy"
    },
    110300: {
      category: "Weapons / Weapons System",
      value: "Grenade Launcher"
    },
    110301: {
      category: "Weapons / Weapons System - Grenade Launcher",
      value: "Light"
    },
    110302: {
      category: "Weapons / Weapons System - Grenade Launcher",
      value: "Medium"
    },
    110303: {
      category: "Weapons / Weapons System - Grenade Launcher",
      value: "Heavy"
    },
    110400: { category: "Weapons / Weapons System", value: "Flame Thrower" },
    110500: {
      category: "Weapons / Weapons System",
      value: "Air Defence Gun"
    },
    110501: {
      category: "Weapons / Weapons System - Air Defence Gun",
      value: "Light"
    },
    110502: {
      category: "Weapons / Weapons System - Air Defence Gun",
      value: "Medium"
    },
    110503: {
      category: "Weapons / Weapons System - Air Defence Gun",
      value: "Heavy"
    },
    110600: { category: "Weapons / Weapons System", value: "Antitank Gun" },
    110601: {
      category: "Weapons / Weapons System - Antitank Gun",
      value: "Light"
    },
    110602: {
      category: "Weapons / Weapons System - Antitank Gun",
      value: "Medium"
    },
    110603: {
      category: "Weapons / Weapons System - Antitank Gun",
      value: "Heavy"
    },
    110700: {
      category: "Weapons / Weapons System",
      value: "Direct Fire Gun"
    },
    110701: {
      category: "Weapons / Weapons System - Direct Fire Gun",
      value: "Light"
    },
    110702: {
      category: "Weapons / Weapons System - Direct Fire Gun",
      value: "Medium"
    },
    110703: {
      category: "Weapons / Weapons System - Direct Fire Gun",
      value: "Heavy"
    },
    110800: { category: "Weapons / Weapons System", value: "Recoilless Gun" },
    110801: {
      category: "Weapons / Weapons System - Recoilless Gun",
      value: "Light"
    },
    110802: {
      category: "Weapons / Weapons System - Recoilless Gun",
      value: "Medium"
    },
    110803: {
      category: "Weapons / Weapons System - Recoilless Gun",
      value: "Heavy"
    },
    110900: { category: "Weapons / Weapons System", value: "Howitzer" },
    110901: {
      category: "Weapons / Weapons System - Howitzer",
      value: "Light"
    },
    110902: {
      category: "Weapons / Weapons System - Howitzer",
      value: "Medium"
    },
    110903: {
      category: "Weapons / Weapons System - Howitzer",
      value: "Heavy"
    },
    111000: {
      category: "Weapons / Weapons System",
      value: "Missile Launcher"
    },
    111001: {
      category: "Weapons / Weapons System - Missile Launcher",
      value: "Light"
    },
    111002: {
      category: "Weapons / Weapons System - Missile Launcher",
      value: "Medium"
    },
    111003: {
      category: "Weapons / Weapons System - Missile Launcher",
      value: "Heavy"
    },
    111100: {
      category: "Weapons / Weapons System",
      value: "Air Defence Missile Launcher"
    },
    111101: {
      category: "Weapons / Weapons System - Air Defence Missile Launcher",
      value: "Light"
    },
    111102: {
      category: "Weapons / Weapons System - Air Defence Missile Launcher",
      value: "Light, Light Transporter-Launcher and Radar (TLAR)"
    },
    111103: {
      category: "Weapons / Weapons System - Air Defence Missile Launcher",
      value: "Light, Light Tactical Landing Approach Radar (TELAR)"
    },
    111104: {
      category: "Weapons / Weapons System - Air Defence Missile Launcher",
      value: "Medium"
    },
    111105: {
      category: "Weapons / Weapons System - Air Defence Missile Launcher",
      value: "Medium, TLAR"
    },
    111106: {
      category: "Weapons / Weapons System - Air Defence Missile Launcher",
      value: "Medium, TELAR"
    },
    111107: {
      category: "Weapons / Weapons System - Air Defence Missile Launcher",
      value: "Heavy"
    },
    111108: {
      category: "Weapons / Weapons System - Air Defence Missile Launcher",
      value: "Heavy, TLAR"
    },
    111109: {
      category: "Weapons / Weapons System - Air Defence Missile Launcher",
      value: "Heavy, TELAR"
    },
    111200: {
      category: "Weapons / Weapons System",
      value: "Antitank Missile Launcher"
    },
    111201: {
      category: "Weapons / Weapons System - Antitank Missile Launcher",
      value: "Light"
    },
    111202: {
      category: "Weapons / Weapons System - Antitank Missile Launcher",
      value: "Medium"
    },
    111203: {
      category: "Weapons / Weapons System - Antitank Missile Launcher",
      value: "Heavy"
    },
    111300: {
      category: "Weapons / Weapons System",
      value: "Surface-to-Surface Missile Launcher"
    },
    111301: {
      category:
        "Weapons / Weapons System - Surface-to-Surface Missile Launcher",
      value: "Light"
    },
    111302: {
      category:
        "Weapons / Weapons System - Surface-to-Surface Missile Launcher",
      value: "Medium"
    },
    111303: {
      category:
        "Weapons / Weapons System - Surface-to-Surface Missile Launcher",
      value: "Heavy"
    },
    111400: { category: "Weapons / Weapons System", value: "Mortar" },
    111401: { category: "Weapons / Weapons System - Mortar", value: "Light" },
    111402: {
      category: "Weapons / Weapons System - Mortar",
      value: "Medium"
    },
    111403: { category: "Weapons / Weapons System - Mortar", value: "Heavy" },
    111500: {
      category: "Weapons / Weapons System",
      value: "Single Rocket Launcher"
    },
    111501: {
      category: "Weapons / Weapons System - Single Rocket Launcher",
      value: "Light"
    },
    111502: {
      category: "Weapons / Weapons System - Single Rocket Launcher",
      value: "Medium"
    },
    111503: {
      category: "Weapons / Weapons System - Single Rocket Launcher",
      value: "Heavy"
    },
    111600: {
      category: "Weapons / Weapons System",
      value: "Multiple Rocket Launcher"
    },
    111601: {
      category: "Weapons / Weapons System - Multiple Rocket Launcher",
      value: "Light"
    },
    111602: {
      category: "Weapons / Weapons System - Multiple Rocket Launcher",
      value: "Medium"
    },
    111603: {
      category: "Weapons / Weapons System - Multiple Rocket Launcher",
      value: "Heavy"
    },
    111700: {
      category: "Weapons / Weapons System",
      value: "Antitank Rocket Launcher"
    },
    111701: {
      category: "Weapons / Weapons System - Antitank Rocket Launcher",
      value: "Light"
    },
    111702: {
      category: "Weapons / Weapons System - Antitank Rocket Launcher",
      value: "Medium"
    },
    111703: {
      category: "Weapons / Weapons System - Antitank Rocket Launcher",
      value: "Heavy"
    },
    111800: {
      category: "Weapons / Weapons System",
      value: "Non-lethal Weapon"
    },
    111900: { category: "Weapons / Weapons System", value: "Taser" },
    112000: { category: "Weapons / Weapons System", value: "Water Cannon" },
    120000: { value: "Vehicles" },
    120100: { category: "Vehicles", value: "Armoured" },
    120101: {
      category: "Vehicles - Armoured",
      value: "Armoured Fighting Vehicle"
    },
    120102: {
      category: "Vehicles - Armoured",
      value: "Armoured Fighting Vehicle Command and Control"
    },
    120103: {
      category: "Vehicles - Armoured",
      value: "Armoured Personnel Carrier"
    },
    120104: {
      category: "Vehicles - Armoured",
      value: "Armoured Personnel Carrier Ambulance"
    },
    120105: {
      category: "Vehicles - Armoured",
      value: "Armoured Protected Vehicle"
    },
    120106: {
      category: "Vehicles - Armoured",
      value: "Armoured Protected Vehicle Recovery"
    },
    120107: {
      category: "Vehicles - Armoured",
      value: "Armoured Protected Vehicle Medical Evacuation"
    },
    120108: {
      category: "Vehicles - Armoured",
      value: "Armoured Personnel Carrier, Recovery"
    },
    120109: {
      category: "Vehicles - Armoured",
      value: "Combat Service Support Vehicle"
    },
    120110: {
      category: "Vehicles - Armoured",
      value: "Light Wheeled Armoured Vehicle"
    },
    120200: { category: "Vehicles", value: "Tank" },
    120201: { category: "Vehicles - Tank", value: "Light" },
    120202: { category: "Vehicles - Tank", value: "Medium" },
    120203: { category: "Vehicles - Tank", value: "Heavy" },
    120300: { category: "Vehicles", value: "Tank Recovery Vehicle" },
    120301: { category: "Vehicles - Tank Recovery Vehicle", value: "Light" },
    120302: { category: "Vehicles - Tank Recovery Vehicle", value: "Medium" },
    120303: { category: "Vehicles - Tank Recovery Vehicle", value: "Heavy" },
    130000: { value: "Engineer Vehicles and Equipment" },
    130100: { category: "Engineer Vehicles and Equipment", value: "Bridge" },
    130200: {
      category: "Engineer Vehicles and Equipment",
      value: "Bridge Mounted on Utility Vehicle"
    },
    130300: {
      category: "Engineer Vehicles and Equipment",
      value: "Fixed Bridge"
    },
    130400: {
      category: "Engineer Vehicles and Equipment",
      value: "Floating Bridge"
    },
    130500: {
      category: "Engineer Vehicles and Equipment",
      value: "Folding Girder Bridge"
    },
    130600: {
      category: "Engineer Vehicles and Equipment",
      value: "Hollow Deck Bridge"
    },
    130700: { category: "Engineer Vehicles and Equipment", value: "Drill" },
    130701: {
      category: "Engineer Vehicles and Equipment - Drill",
      value: "Drill Mounted on Utility Vehicle"
    },
    130800: {
      category: "Engineer Vehicles and Equipment",
      value: "Earthmover"
    },
    130801: {
      category: "Engineer Vehicles and Equipment - Earthmover",
      value: "Multifunctional Earthmover / Digger"
    },
    130900: {
      category: "Engineer Vehicles and Equipment",
      value: "Mine Clearing Equipment"
    },
    130901: {
      category: "Engineer Vehicles and Equipment - Mine Clearing Equipment",
      value: "Trailer Mounted"
    },
    130902: {
      category: "Engineer Vehicles and Equipment - Mine Clearing Equipment",
      value: "Mine Clearing Equipment on Tank Chassis"
    },
    131000: {
      category: "Engineer Vehicles and Equipment",
      value: "Mine Laying Equipment"
    },
    131001: {
      category: "Engineer Vehicles and Equipment - Mine Laying Equipment",
      value: "Mine Laying Equipment on Utility Vehicle"
    },
    131002: {
      category: "Engineer Vehicles and Equipment - Mine Laying Equipment",
      value: "Armoured Carrier with Volcano"
    },
    131003: {
      category: "Engineer Vehicles and Equipment - Mine Laying Equipment",
      value: "Truck Mounted with Volcano"
    },
    131100: { category: "Engineer Vehicles and Equipment", value: "Dozer" },
    131101: {
      category: "Engineer Vehicles and Equipment - Dozer",
      value: "Dozer , Armoured"
    },
    131200: {
      category: "Engineer Vehicles and Equipment",
      value: "Armoured Assault"
    },
    131300: {
      category: "Engineer Vehicles and Equipment",
      value: "Armoured Engineer Recon Vehicle (AERV)"
    },
    131400: { category: "Engineer Vehicles and Equipment", value: "Backhoe" },
    131500: {
      category: "Engineer Vehicles and Equipment",
      value: "Construction Vehicle"
    },
    131600: {
      category: "Engineer Vehicles and Equipment",
      value: "Ferry Transporter"
    },
    140000: { value: "Utility Vehicles" },
    140100: { category: "Utility Vehicles", value: "Utility" },
    140200: { category: "Utility Vehicles", value: "Medical" },
    140300: {
      category: "Utility Vehicles",
      value: "Medical Evacuation (MEDEVAC)"
    },
    140400: {
      category: "Utility Vehicles",
      value: "Mobile Emergency Physician"
    },
    140500: { category: "Utility Vehicles", value: "Bus" },
    140600: { category: "Utility Vehicles", value: "Semi-Trailer and Truck" },
    140601: {
      category: "Utility Vehicles - Semi-Trailer and Truck",
      value: "Light"
    },
    140602: {
      category: "Utility Vehicles - Semi-Trailer and Truck",
      value: "Medium"
    },
    140603: {
      category: "Utility Vehicles - Semi-Trailer and Truck",
      value: "Heavy"
    },
    140700: {
      category: "Utility Vehicles",
      value: "Limited Cross Country Truck"
    },
    140800: { category: "Utility Vehicles", value: "Cross Country Truck" },
    140900: {
      category: "Utility Vehicles",
      value: "Petroleum, Oil and Lubricant"
    },
    141000: { category: "Utility Vehicles", value: "Water" },
    141100: {
      category: "Utility Vehicles",
      value: "Amphibious Utility Wheeled Vehicle"
    },
    141200: { category: "Utility Vehicles", value: "Tow Truck" },
    141201: { category: "Utility Vehicles - Tow Truck", value: "Light" },
    141202: { category: "Utility Vehicles - Tow Truck", value: "Heavy" },
    150000: { value: "Trains" },
    150100: { category: "Trains", value: "Locomotive" },
    150200: { category: "Trains", value: "Railcar" },
    160000: { value: "Civilian Vehicles" },
    160100: { category: "Civilian Vehicles", value: "Automobile" },
    160101: { category: "Civilian Vehicles - Automobile", value: "Compact" },
    160102: { category: "Civilian Vehicles - Automobile", value: "Midsize" },
    160103: { category: "Civilian Vehicles - Automobile", value: "Sedan" },
    160200: { category: "Civilian Vehicles", value: "Open-Bed Truck" },
    160201: {
      category: "Civilian Vehicles - Open-Bed Truck",
      value: "Pickup"
    },
    160202: {
      category: "Civilian Vehicles - Open-Bed Truck",
      value: "Small"
    },
    160203: {
      category: "Civilian Vehicles - Open-Bed Truck",
      value: "Large"
    },
    160300: {
      category: "Civilian Vehicles",
      value: "Multiple Passenger Vehicle"
    },
    160301: {
      category: "Civilian Vehicles - Multiple Passenger Vehicle",
      value: "Van"
    },
    160302: {
      category: "Civilian Vehicles - Multiple Passenger Vehicle",
      value: "Small Bus"
    },
    160303: {
      category: "Civilian Vehicles - Multiple Passenger Vehicle",
      value: "Large Bus"
    },
    160400: { category: "Civilian Vehicles", value: "Utility Vehicle" },
    160401: {
      category: "Civilian Vehicles - Utility Vehicle",
      value: "Sport Utility Vehicle (SUV)"
    },
    160402: {
      category: "Civilian Vehicles - Utility Vehicle",
      value: "Small Box Truck"
    },
    160403: {
      category: "Civilian Vehicles - Utility Vehicle",
      value: "Large Box Truck"
    },
    160500: { category: "Civilian Vehicles", value: "Jeep Type Vehicle" },
    160501: {
      category: "Civilian Vehicles - Jeep Type Vehicle",
      value: "Small / Light"
    },
    160502: {
      category: "Civilian Vehicles - Jeep Type Vehicle",
      value: "Medium"
    },
    160503: {
      category: "Civilian Vehicles - Jeep Type Vehicle",
      value: "Large / Heavy"
    },
    160600: {
      category: "Civilian Vehicles",
      value: "Tractor Trailer Truck with Box"
    },
    160601: {
      category: "Civilian Vehicles - Tractor Trailer Truck with Box",
      value: "Small / Light"
    },
    160602: {
      category: "Civilian Vehicles - Tractor Trailer Truck with Box",
      value: "Medium"
    },
    160603: {
      category: "Civilian Vehicles - Tractor Trailer Truck with Box",
      value: "Large / Heavy"
    },
    160700: {
      category: "Civilian Vehicles",
      value: "Tractor Trailer Truck with Flatbed Trailer"
    },
    160701: {
      category:
        "Civilian Vehicles - Tractor Trailer Truck with Flatbed Trailer",
      value: "Small / Light"
    },
    160702: {
      category:
        "Civilian Vehicles - Tractor Trailer Truck with Flatbed Trailer",
      value: "Medium"
    },
    160703: {
      category:
        "Civilian Vehicles - Tractor Trailer Truck with Flatbed Trailer",
      value: "Large / Heavy"
    },
    160800: {
      category: "Civilian Vehicles",
      value: "Known Insurgent Vehicle"
    },
    160900: { category: "Civilian Vehicles", value: "Drug Vehicle" },
    170000: { value: "Law Enforcement" },
    170100: {
      category: "Law Enforcement",
      value:
        "Bureau of Alcohol, Tobacco, Firearms and Explosives (ATF) (Department of Justice)"
    },
    170200: { category: "Law Enforcement", value: "Border Patrol" },
    170300: { category: "Law Enforcement", value: "Customs Service" },
    170400: {
      category: "Law Enforcement",
      value: "Drug Enforcement Administration (DEA)"
    },
    170500: {
      category: "Law Enforcement",
      value: "Department of Justice (DOJ)"
    },
    170600: {
      category: "Law Enforcement",
      value: "Federal Bureau of Investigation (FBI)"
    },
    170700: { category: "Law Enforcement", value: "Police" },
    170800: {
      category: "Law Enforcement",
      value: "United States Secret Service (USSS)"
    },
    170900: {
      category: "Law Enforcement",
      value: "Transportation Security Administration (TSA)"
    },
    171000: { category: "Law Enforcement", value: "Coast Guard" },
    171100: { category: "Law Enforcement", value: "US Marshals Service" },
    180000: { value: "Pack Animals" },
    190000: { value: "Missile Support" },
    190100: { category: "Missile Support", value: "Transloader" },
    190200: { category: "Missile Support", value: "Transporter" },
    190300: { category: "Missile Support", value: "Crane / Loading Device" },
    190400: { category: "Missile Support", value: "Propellant Transporter" },
    190500: { category: "Missile Support", value: "Warhead Transporter" },
    200000: { value: "Other Equipment" },
    200100: { category: "Other Equipment", value: "Antennae" },
    200200: { category: "Other Equipment", value: "Bomb" },
    200300: { category: "Other Equipment", value: "Booby Trap" },
    200400: { category: "Other Equipment", value: "CBRN Defence Equipment" },
    200500: { category: "Other Equipment", value: "Computer System" },
    200600: {
      category: "Other Equipment",
      value: "Command Launch Equipment (CLE)"
    },
    200700: { category: "Other Equipment", value: "Generator Set" },
    200800: {
      category: "Other Equipment",
      value: "Ground-based Midcourse Defence (GMD) Fire Control (GFC) Centre"
    },
    200900: {
      category: "Other Equipment",
      value:
        "In-Flight Interceptor Communications System (IFICS) Data Terminal (IDT)"
    },
    201000: { category: "Other Equipment", value: "Laser" },
    201100: {
      category: "Other Equipment",
      value: "Psychological Operations (PSYOPS)"
    },
    201200: { category: "Other Equipment", value: "Sustainment Shipments" },
    201300: { category: "Other Equipment", value: "Tent" },
    201400: {
      category: "Other Equipment",
      value: "Unit Deployment Shipments"
    },
    201500: {
      category: "Other Equipment",
      value: "Emergency Medical Operation"
    },
    201501: {
      category: "Other Equipment - Emergency Medical Operation",
      value: "Medical Evacuation Helicopter"
    },
    210000: { value: "Land Mines" },
    210100: { category: "Land Mines", value: "Land Mine" },
    210200: {
      category: "Land Mines",
      value: "Antipersonnel Land Mine (APL)"
    },
    210300: { category: "Land Mines", value: "Antitank Mine" },
    210400: {
      category: "Land Mines",
      value: "Improvised Explosive Device (IED)"
    },
    210500: { category: "Land Mines", value: "Less than lethal" },
    220000: { value: "Sensors" },
    220100: { category: "Sensors", value: "Sensor" },
    220200: { category: "Sensors", value: "Sensor Emplaced" },
    220300: { category: "Sensors", value: "Radar" },
    230000: { value: "Emergency Operation" },
    230100: { category: "Emergency Operation", value: "Ambulance" },
    230200: {
      category: "Emergency Operation",
      value: "Fire Fighting / Fire Protection"
    },
    240000: { value: "Manual Track" },
    250000: { value: "Rotary Wing" }
  },
  20: {
    "000000": { value: "Unspecified" },
    110000: { value: "Installation" },
    110100: {
      category: "Installation",
      value: "Aircraft Production / Assembly"
    },
    110200: {
      category: "Installation",
      value: "Ammunition and Explosives / Production"
    },
    110300: { category: "Installation", value: "Ammunition Cache" },
    110400: { category: "Installation", value: "Armament Production" },
    110500: { category: "Installation", value: "Black List Location" },
    110600: {
      category: "Installation",
      value: "Chemical, Biological, Radiological and Nuclear (CBRN)"
    },
    110700: {
      category: "Installation",
      value: "Engineering Equipment Production"
    },
    110701: {
      category: "Installation - Engineering Equipment Production",
      value: "Bridge"
    },
    110800: { category: "Installation", value: "Equipment Manufacture" },
    110900: { category: "Installation", value: "Government Leadership" },
    111000: { category: "Installation", value: "Gray List Location" },
    111100: { category: "Installation", value: "Mass Grave Site" },
    111200: { category: "Installation", value: "Materiel" },
    111300: { category: "Installation", value: "Mine" },
    111400: {
      category: "Installation",
      value: "Missile and Space System Production"
    },
    111500: { category: "Installation", value: "Nuclear (Non CBRN Defence)" },
    111600: { category: "Installation", value: "Printed Media" },
    111700: { category: "Installation", value: "Safe House" },
    111800: { category: "Installation", value: "White List Location" },
    111900: { category: "Installation", value: "Tented Camp" },
    111901: {
      category: "Installation - Tented Camp",
      value: "Displaced Persons /  Refugee / Evacuees Camp"
    },
    111902: {
      category: "Installation - Tented Camp",
      value: "Training Camp"
    },
    112000: {
      category: "Installation",
      value: "Warehouse / Storage Facility"
    },
    112100: { category: "Installation", value: "Law  Enforcement" },
    112101: {
      category: "Installation - Law  Enforcement",
      value:
        "Bureau of Alcohol, Tobacco, Firearms and Explosives (ATF) (Department of Justice)"
    },
    112102: {
      category: "Installation - Law  Enforcement",
      value: "Border Patrol"
    },
    112103: {
      category: "Installation - Law  Enforcement",
      value: "Customs Service"
    },
    112104: {
      category: "Installation - Law  Enforcement",
      value: "Drug Enforcement Administration (DEA)"
    },
    112105: {
      category: "Installation - Law  Enforcement",
      value: "Department of Justice (DOJ)"
    },
    112106: {
      category: "Installation - Law  Enforcement",
      value: "Federal Bureau of Investigation (FBI)"
    },
    112107: { category: "Installation - Law  Enforcement", value: "Police" },
    112108: { category: "Installation - Law  Enforcement", value: "Prison" },
    112109: {
      category: "Installation - Law  Enforcement",
      value: "United States Secret Service (USSS)"
    },
    112110: {
      category: "Installation - Law  Enforcement",
      value: "Transportation Security Administration (TSA)"
    },
    112111: {
      category: "Installation - Law  Enforcement",
      value: "Coast Guard"
    },
    112112: {
      category: "Installation - Law  Enforcement",
      value: "US Marshals Service"
    },
    112200: { category: "Installation", value: "Emergency Operation" },
    112201: {
      category: "Installation - Emergency Operation",
      value: "Fire Station"
    },
    112202: {
      category: "Installation - Emergency Operation",
      value: "Emergency Medical Operation"
    },
    120000: { value: "Infrastructure" },
    120100: {
      category: "Infrastructure",
      value: "Agriculture and Food Infrastructure"
    },
    120101: {
      category: "Infrastructure - Agriculture and Food Infrastructure",
      value: "Agricultural Laboratory"
    },
    120102: {
      category: "Infrastructure - Agriculture and Food Infrastructure",
      value: "Animal Feedlot"
    },
    120103: {
      category: "Infrastructure - Agriculture and Food Infrastructure",
      value: "Commercial Food Distribution Centre"
    },
    120104: {
      category: "Infrastructure - Agriculture and Food Infrastructure",
      value: "Farm / Ranch"
    },
    120105: {
      category: "Infrastructure - Agriculture and Food Infrastructure",
      value: "Food Distribution"
    },
    120106: {
      category: "Infrastructure - Agriculture and Food Infrastructure",
      value: "Food Production Centre"
    },
    120107: {
      category: "Infrastructure - Agriculture and Food Infrastructure",
      value: "Food Retail"
    },
    120108: {
      category: "Infrastructure - Agriculture and Food Infrastructure",
      value: "Grain Storage"
    },
    120200: {
      category: "Infrastructure",
      value: "Banking Finance and Insurance  Infrastructure"
    },
    120201: {
      category:
        "Infrastructure - Banking Finance and Insurance  Infrastructure",
      value: "ATM"
    },
    120202: {
      category:
        "Infrastructure - Banking Finance and Insurance  Infrastructure",
      value: "Bank"
    },
    120203: {
      category:
        "Infrastructure - Banking Finance and Insurance  Infrastructure",
      value: "Bullion Storage"
    },
    120204: {
      category:
        "Infrastructure - Banking Finance and Insurance  Infrastructure",
      value: "Economic Infrastructure Asset"
    },
    120205: {
      category:
        "Infrastructure - Banking Finance and Insurance  Infrastructure",
      value: "Federal Reserve Bank"
    },
    120206: {
      category:
        "Infrastructure - Banking Finance and Insurance  Infrastructure",
      value: "Financial Exchange"
    },
    120207: {
      category:
        "Infrastructure - Banking Finance and Insurance  Infrastructure",
      value: "Financial Services, Other"
    },
    120300: {
      category: "Infrastructure",
      value: "Commercial Infrastructure"
    },
    120301: {
      category: "Infrastructure - Commercial Infrastructure",
      value: "Chemical Plant"
    },
    120302: {
      category: "Infrastructure - Commercial Infrastructure",
      value: "Firearms Manufacturer"
    },
    120303: {
      category: "Infrastructure - Commercial Infrastructure",
      value: "Firearms Retailer"
    },
    120304: {
      category: "Infrastructure - Commercial Infrastructure",
      value: "Hazardous Material Production"
    },
    120305: {
      category: "Infrastructure - Commercial Infrastructure",
      value: "Hazardous Material Storage"
    },
    120306: {
      category: "Infrastructure - Commercial Infrastructure",
      value: "Industrial Site"
    },
    120307: {
      category: "Infrastructure - Commercial Infrastructure",
      value: "Landfill"
    },
    120308: {
      category: "Infrastructure - Commercial Infrastructure",
      value: "Pharmaceutical Manufacturer"
    },
    120309: {
      category: "Infrastructure - Commercial Infrastructure",
      value: "Contaminated Hazardous Waste Site"
    },
    120310: {
      category: "Infrastructure - Commercial Infrastructure",
      value: "Toxic Release Inventory"
    },
    120400: {
      category: "Infrastructure",
      value: "Educational Facilities Infrastructure"
    },
    120401: {
      category: "Infrastructure - Educational Facilities Infrastructure",
      value: "College / University"
    },
    120402: {
      category: "Infrastructure - Educational Facilities Infrastructure",
      value: "School"
    },
    120500: {
      category: "Infrastructure",
      value: "Energy Facility Infrastructure"
    },
    120501: {
      category: "Infrastructure - Energy Facility Infrastructure",
      value: "Electric Power"
    },
    120502: {
      category: "Infrastructure - Energy Facility Infrastructure",
      value: "Generation Station"
    },
    120503: {
      category: "Infrastructure - Energy Facility Infrastructure",
      value: "Natural Gas Facility"
    },
    120504: {
      category: "Infrastructure - Energy Facility Infrastructure",
      value: "Petroleum Facility"
    },
    120505: {
      category: "Infrastructure - Energy Facility Infrastructure",
      value: "Petroleum / Gas / Oil"
    },
    120506: {
      category: "Infrastructure - Energy Facility Infrastructure",
      value: "Propane Facility"
    },
    120600: {
      category: "Infrastructure",
      value: "Government Site Infrastructure"
    },
    120700: { category: "Infrastructure", value: "Medical Infrastructure" },
    120701: {
      category: "Infrastructure - Medical Infrastructure",
      value: "Medical"
    },
    120702: {
      category: "Infrastructure - Medical Infrastructure",
      value: "Medical Treatment Facility (Hospital)"
    },
    120800: { category: "Infrastructure", value: "Military Infrastructure" },
    120801: {
      category: "Infrastructure - Military Infrastructure",
      value: "Military Armoury"
    },
    120802: {
      category: "Infrastructure - Military Infrastructure",
      value: "Military Base"
    },
    120900: {
      category: "Infrastructure",
      value: "Postal Services Infrastructure"
    },
    120901: {
      category: "Infrastructure - Postal Services Infrastructure",
      value: "Postal Distribution Centre"
    },
    120902: {
      category: "Infrastructure - Postal Services Infrastructure",
      value: "Post Office"
    },
    121000: {
      category: "Infrastructure",
      value: "Public Venues Infrastructure"
    },
    121001: {
      category: "Infrastructure - Public Venues Infrastructure",
      value: "Enclosed Facility (Public Venue)"
    },
    121002: {
      category: "Infrastructure - Public Venues Infrastructure",
      value: "Open Facility (Public Venue)"
    },
    121003: {
      category: "Infrastructure - Public Venues Infrastructure",
      value: "Recreational Area"
    },
    121004: {
      category: "Infrastructure - Public Venues Infrastructure",
      value: "Religious Institution"
    },
    121100: {
      category: "Infrastructure",
      value: "Special Needs Infrastructure"
    },
    121101: {
      category: "Infrastructure - Special Needs Infrastructure",
      value: "Adult Day Care"
    },
    121102: {
      category: "Infrastructure - Special Needs Infrastructure",
      value: "Child Day Care"
    },
    121103: {
      category: "Infrastructure - Special Needs Infrastructure",
      value: "Elder Care"
    },
    121200: {
      category: "Infrastructure",
      value: "Telecommunications Infrastructure"
    },
    121201: {
      category: "Infrastructure - Telecommunications Infrastructure",
      value: "Broadcast Transmitter Antennae"
    },
    121202: {
      category: "Infrastructure - Telecommunications Infrastructure",
      value: "Telecommunications"
    },
    121203: {
      category: "Infrastructure - Telecommunications Infrastructure",
      value: "Telecommunications Tower"
    },
    121300: {
      category: "Infrastructure",
      value: "Transportation Infrastructure"
    },
    121301: {
      category: "Infrastructure - Transportation Infrastructure",
      value: "Airport / Air Base"
    },
    121302: {
      category: "Infrastructure - Transportation Infrastructure",
      value: "Air Traffic Control Facility"
    },
    121303: {
      category: "Infrastructure - Transportation Infrastructure",
      value: "Bus Station"
    },
    121304: {
      category: "Infrastructure - Transportation Infrastructure",
      value: "Ferry Terminal"
    },
    121305: {
      category: "Infrastructure - Transportation Infrastructure",
      value: "Helicopter Landing Site"
    },
    121306: {
      category: "Infrastructure - Transportation Infrastructure",
      value: "Maintenance Facility"
    },
    121307: {
      category: "Infrastructure - Transportation Infrastructure",
      value: "Railhead / Railroad Station"
    },
    121308: {
      category: "Infrastructure - Transportation Infrastructure",
      value: "Rest Stop"
    },
    121309: {
      category: "Infrastructure - Transportation Infrastructure",
      value: "Sea Port / Naval Base"
    },
    121310: {
      category: "Infrastructure - Transportation Infrastructure",
      value: "Ship Yard"
    },
    121311: {
      category: "Infrastructure - Transportation Infrastructure",
      value: "Toll Facility"
    },
    121312: {
      category: "Infrastructure - Transportation Infrastructure",
      value: "Traffic Inspection Facility"
    },
    121313: {
      category: "Infrastructure - Transportation Infrastructure",
      value: "Tunnel"
    },
    121400: {
      category: "Infrastructure",
      value: "Water Supply Infrastructure"
    },
    121401: {
      category: "Infrastructure - Water Supply Infrastructure",
      value: "Control Valve"
    },
    121402: {
      category: "Infrastructure - Water Supply Infrastructure",
      value: "Dam"
    },
    121403: {
      category: "Infrastructure - Water Supply Infrastructure",
      value: "Discharge Outfall"
    },
    121404: {
      category: "Infrastructure - Water Supply Infrastructure",
      value: "Ground Water Well"
    },
    121405: {
      category: "Infrastructure - Water Supply Infrastructure",
      value: "Pumping Station"
    },
    121406: {
      category: "Infrastructure - Water Supply Infrastructure",
      value: "Reservoir"
    },
    121407: {
      category: "Infrastructure - Water Supply Infrastructure",
      value: "Storage Tower"
    },
    121408: {
      category: "Infrastructure - Water Supply Infrastructure",
      value: "Surface Water Intake"
    },
    121409: {
      category: "Infrastructure - Water Supply Infrastructure",
      value: "Wastewater Treatment Facility"
    },
    121410: {
      category: "Infrastructure - Water Supply Infrastructure",
      value: "Water"
    },
    121411: {
      category: "Infrastructure - Water Supply Infrastructure",
      value: "Water Treatment"
    }
  },
  // 25: "Control measure",
  27: {
    "000000": { value: "Unspecified" },
    110000: { value: "Military" },
    110100: { category: "Military", value: "Service / Branch" },
    110101: { category: "Military - Service / Branch", value: "Infantry" },
    110102: { category: "Military - Service / Branch", value: "Medical" },
    110103: {
      category: "Military - Service / Branch",
      value: "Reconnaissance"
    },
    110104: { category: "Military - Service / Branch", value: "Signal" },
    110200: { category: "Military", value: "Activity / Task" },
    110201: {
      category: "Military - Activity / Task",
      value: "Explosive Ordnance Disposal"
    },
    110202: {
      category: "Military - Activity / Task",
      value: "Field Artillery Observer"
    },
    110203: {
      category: "Military - Activity / Task",
      value: "Joint Fire Support"
    },
    110204: { category: "Military - Activity / Task", value: "Liaison" },
    110205: { category: "Military - Activity / Task", value: "Messenger" },
    110206: {
      category: "Military - Activity / Task",
      value: "Military Police"
    },
    110207: { category: "Military - Activity / Task", value: "Observer" },
    110208: { category: "Military - Activity / Task", value: "Security" },
    110209: { category: "Military - Activity / Task", value: "Sniper" },
    110210: {
      category: "Military - Activity / Task",
      value: "Special Operation Forces"
    },
    110300: { category: "Military", value: "Lethal Weapons" },
    110301: { category: "Military - Lethal Weapons", value: "Rifle" },
    110302: {
      category: "Military - Lethal Weapons",
      value: "Single Shot Rifle"
    },
    110303: {
      category: "Military - Lethal Weapons",
      value: "Semiautomatic Rifle"
    },
    110304: {
      category: "Military - Lethal Weapons",
      value: "Automatic Rifle"
    },
    110305: { category: "Military - Lethal Weapons", value: "Machine Gun" },
    110306: {
      category: "Military - Lethal Weapons",
      value: "Machine Gun - Light"
    },
    110307: {
      category: "Military - Lethal Weapons",
      value: "Machine Gun - Medium"
    },
    110308: {
      category: "Military - Lethal Weapons",
      value: "Machine Gun - Heavy"
    },
    110309: {
      category: "Military - Lethal Weapons",
      value: "Grenade Launcher"
    },
    110310: {
      category: "Military - Lethal Weapons",
      value: "Grenade Launcher - Light"
    },
    110311: {
      category: "Military - Lethal Weapons",
      value: "Grenade Launcher - Medium"
    },
    110312: {
      category: "Military - Lethal Weapons",
      value: "Grenade Launcher - Heavy"
    },
    110313: { category: "Military - Lethal Weapons", value: "Flame Thrower" },
    110314: { category: "Military - Lethal Weapons", value: "Mortar" },
    110315: {
      category: "Military - Lethal Weapons",
      value: "Single Rocket Launcher"
    },
    110316: {
      category: "Military - Lethal Weapons",
      value: "Antitank Rocket Launcher"
    },
    110400: { category: "Military", value: "Non-Lethal Weapons" },
    110401: {
      category: "Military - Non-Lethal Weapons",
      value: "Non-Lethal Weapon"
    },
    110402: {
      category: "Military - Non-Lethal Weapons",
      value: "Non-Lethal Grenade Launcher"
    },
    110403: { category: "Military - Non-Lethal Weapons", value: "Taser" },
    120000: { value: "Civilian" },
    120100: { category: "Civilian", value: "Activity / Task" },
    120101: { category: "Civilian - Activity / Task", value: "Police" }
  },
  30: {
    "000000": { value: "Unspecified" },
    110000: { value: "Military" },
    120000: { value: "Military Combatant" },
    120100: { category: "Military Combatant", value: "Carrier" },
    120200: {
      category: "Military Combatant",
      value: "Surface Combatant, Line"
    },
    120201: {
      category: "Military Combatant - Surface Combatant, Line",
      value: "Battleship"
    },
    120202: {
      category: "Military Combatant - Surface Combatant, Line",
      value: "Cruiser"
    },
    120203: {
      category: "Military Combatant - Surface Combatant, Line",
      value: "Destroyer"
    },
    120204: {
      category: "Military Combatant - Surface Combatant, Line",
      value: "Frigate"
    },
    120205: {
      category: "Military Combatant - Surface Combatant, Line",
      value: "Corvette"
    },
    120206: {
      category: "Military Combatant - Surface Combatant, Line",
      value: "Littoral Combatant Ship"
    },
    120300: {
      category: "Military Combatant",
      value: "Amphibious Warfare Ship"
    },
    120301: {
      category: "Military Combatant - Amphibious Warfare Ship",
      value: "Amphibious Force Flagship or Amphibious Command Ship"
    },
    120302: {
      category: "Military Combatant - Amphibious Warfare Ship",
      value: "Amphibious Assault, Nonspecified"
    },
    120303: {
      category: "Military Combatant - Amphibious Warfare Ship",
      value: "Amphibious Assault Ship, General"
    },
    120304: {
      category: "Military Combatant - Amphibious Warfare Ship",
      value: "Amphibious Assault Ship, Multipurpose"
    },
    120305: {
      category: "Military Combatant - Amphibious Warfare Ship",
      value: "Amphibious Assault Ship, Helicopter"
    },
    120306: {
      category: "Military Combatant - Amphibious Warfare Ship",
      value: "Amphibious Transport Dock"
    },
    120307: {
      category: "Military Combatant - Amphibious Warfare Ship",
      value: "Landing Ship General"
    },
    120308: {
      category: "Military Combatant - Amphibious Warfare Ship",
      value: "Landing Craft"
    },
    120400: {
      category: "Military Combatant",
      value: "Mine Warfare Ship, General"
    },
    120401: {
      category: "Military Combatant - Mine Warfare Ship, General",
      value: "Mine Layer General"
    },
    120402: {
      category: "Military Combatant - Mine Warfare Ship, General",
      value: "Mine Sweeper General"
    },
    120403: {
      category: "Military Combatant - Mine Warfare Ship, General",
      value: "Mine Sweeper, Drone"
    },
    120404: {
      category: "Military Combatant - Mine Warfare Ship, General",
      value: "Mine Hunter General"
    },
    120405: {
      category: "Military Combatant - Mine Warfare Ship, General",
      value: "Mine Countermeasures Vessel, General"
    },
    120406: {
      category: "Military Combatant - Mine Warfare Ship, General",
      value: "Mine Countermeasures, Support Ship"
    },
    120500: { category: "Military Combatant", value: "Patrol Boat General" },
    120501: {
      category: "Military Combatant - Patrol Boat General",
      value: "Patrol Craft, Submarine Chaser / Escort, General"
    },
    120502: {
      category: "Military Combatant - Patrol Boat General",
      value: "Patrol Ship, Gun Equipped General"
    },
    120600: { category: "Military Combatant", value: "Decoy" },
    120700: {
      category: "Military Combatant",
      value: "Unmanned Surface Water Vehicle (USV)"
    },
    120800: { category: "Military Combatant", value: "Spdboat" },
    120801: {
      category: "Military Combatant - Spdboat",
      value: "Rigid-Hull Inflatable Boat (RHIB)"
    },
    120900: { category: "Military Combatant", value: "Jet Ski" },
    121000: {
      category: "Military Combatant",
      value: "Navy Task Organization"
    },
    121001: {
      category: "Military Combatant - Navy Task Organization",
      value: "Navy Task Element"
    },
    121002: {
      category: "Military Combatant - Navy Task Organization",
      value: "Navy Task Force"
    },
    121003: {
      category: "Military Combatant - Navy Task Organization",
      value: "Navy Task Group"
    },
    121004: {
      category: "Military Combatant - Navy Task Organization",
      value: "Navy Task Unit"
    },
    121005: {
      category: "Military Combatant - Navy Task Organization",
      value: "Convoy"
    },
    121100: {
      category: "Military Combatant",
      value: "Sea-Based X-Band Radar"
    },
    130000: { value: "Military Non Combatant" },
    130100: {
      category: "Military Non Combatant",
      value: "Auxiliary Ship General"
    },
    130101: {
      category: "Military Non Combatant - Auxiliary Ship General",
      value: "Ammunition Ship"
    },
    130102: {
      category: "Military Non Combatant - Auxiliary Ship General",
      value: "Stores Ship (Naval)"
    },
    130103: {
      category: "Military Non Combatant - Auxiliary Ship General",
      value: "Auxiliary Flag or Command Ship"
    },
    130104: {
      category: "Military Non Combatant - Auxiliary Ship General",
      value: "Intelligence Collector"
    },
    130105: {
      category: "Military Non Combatant - Auxiliary Ship General",
      value: "Oceanographic Research Ship (AGOR)"
    },
    130106: {
      category: "Military Non Combatant - Auxiliary Ship General",
      value: "Survey Ship"
    },
    130107: {
      category: "Military Non Combatant - Auxiliary Ship General",
      value: "Hospital Ship"
    },
    130108: {
      category: "Military Non Combatant - Auxiliary Ship General",
      value: "Cargo Ship (Naval)"
    },
    130109: {
      category: "Military Non Combatant - Auxiliary Ship General",
      value: "Combat Support Ship Fast (Naval)"
    },
    130110: {
      category: "Military Non Combatant - Auxiliary Ship General",
      value: "Oiler, Replenishment (Naval)"
    },
    130111: {
      category: "Military Non Combatant - Auxiliary Ship General",
      value: "Repair Ship"
    },
    130112: {
      category: "Military Non Combatant - Auxiliary Ship General",
      value: "Submarine Tender"
    },
    130113: {
      category: "Military Non Combatant - Auxiliary Ship General",
      value: "Tug, Ocean Going"
    },
    130200: {
      category: "Military Non Combatant",
      value: "Service Craft / Yard"
    },
    130201: {
      category: "Military Non Combatant - Service Craft / Yard",
      value: "Barge, not Self-Propelled"
    },
    130202: {
      category: "Military Non Combatant - Service Craft / Yard",
      value: "Barge, Self-Propelled"
    },
    130203: {
      category: "Military Non Combatant - Service Craft / Yard",
      value: "Tug, Harbour"
    },
    130204: {
      category: "Military Non Combatant - Service Craft / Yard",
      value: "Lighter, Torpedo Transport"
    },
    140000: { value: "Civilian" },
    140100: { category: "Civilian", value: "Merchant Ship, General" },
    140101: {
      category: "Civilian - Merchant Ship, General",
      value: "Merchant Ship, Dry Cargo, Break Bulk"
    },
    140102: {
      category: "Civilian - Merchant Ship, General",
      value: "Merchant Ship, Container"
    },
    140103: {
      category: "Civilian - Merchant Ship, General",
      value: "Merchant Dredger"
    },
    140104: {
      category: "Civilian - Merchant Ship, General",
      value: "Merchant Ship, Roll-On, Roll-Off (RO / RO)"
    },
    140105: {
      category: "Civilian - Merchant Ship, General",
      value: "Merchant Ship, Car / Passenger Ferry"
    },
    140106: {
      category: "Civilian - Merchant Ship, General",
      value: "Merchant Ship, Heavy Lift"
    },
    140107: {
      category: "Civilian - Merchant Ship, General",
      value: "Hovercraft, General"
    },
    140108: {
      category: "Civilian - Merchant Ship, General",
      value: "Merchant Ship, Lash"
    },
    140109: {
      category: "Civilian - Merchant Ship, General",
      value: "Merchant Ship, Tanker"
    },
    140110: {
      category: "Civilian - Merchant Ship, General",
      value: "Merchant Ship, Passenger"
    },
    140111: {
      category: "Civilian - Merchant Ship, General",
      value: "MERCHANT SHIP, TUG, OCEAN GOING"
    },
    140112: { category: "Civilian - Merchant Ship, General", value: "Tow" },
    140113: {
      category: "Civilian - Merchant Ship, General",
      value: "Transport Ship, Hazardous Material"
    },
    140114: {
      category: "Civilian - Merchant Ship, General",
      value: "Junk / Dhow - Dhow"
    },
    140115: {
      category: "Civilian - Merchant Ship, General",
      value: "Barge, not Self-Propelled"
    },
    140116: {
      category: "Civilian - Merchant Ship, General",
      value: "Hospital Ship"
    },
    140200: { category: "Civilian", value: "Fishing Vessel, General" },
    140201: {
      category: "Civilian - Fishing Vessel, General",
      value: "Drifter"
    },
    140202: {
      category: "Civilian - Fishing Vessel, General",
      value: "Trawler"
    },
    140203: {
      category: "Civilian - Fishing Vessel, General",
      value: "Merchant, Dredger"
    },
    140300: { category: "Civilian", value: "Law Enforcement Vessel" },
    140400: { category: "Civilian", value: "Leisure Craft, Sailing" },
    140500: { category: "Civilian", value: "Leisure Craft, Motorized" },
    140501: {
      category: "Civilian - Leisure Craft, Motorized",
      value: "Rigid-Hull Inflatable Boat (RHIB)"
    },
    140502: {
      category: "Civilian - Leisure Craft, Motorized",
      value: "Spdboat"
    },
    140600: { category: "Civilian", value: "Jet Ski" },
    140700: {
      category: "Civilian",
      value: "Unmanned Surface Water Vehicle (USV)"
    },
    150000: { value: "Own Ship" },
    160000: { value: "Fused Track" },
    170000: { value: "Manual Track" }
  },
  35: {
    "000000": { value: "Unspecified" },
    110000: { value: "Military" },
    110100: { category: "Military", value: "Submarine, General" },
    110101: {
      category: "Military - Submarine, General",
      value: "Submarine, Surfaced"
    },
    110102: {
      category: "Military - Submarine, General",
      value: "Submarine, Snorkelling"
    },
    110103: {
      category: "Military - Submarine, General",
      value: "Submarine, Bottomed"
    },
    110200: { category: "Military", value: "Other Submersible" },
    110300: { category: "Military", value: "Nonsubmarine" },
    110400: {
      category: "Military",
      value:
        "Autonomous Underwater Vehicle (AUV) / Unmanned Underwater Vehicle (UUV)"
    },
    110500: { category: "Military", value: "Diver" },
    120000: { value: "Civilian" },
    120100: {
      category: "Civilian",
      value: "Submersible, General (Commercial) Submersible"
    },
    120200: {
      category: "Civilian",
      value:
        "Autonomous Underwater Vehicle (AUV) /  Unmanned Underwater Vehicle (UUV)"
    },
    120300: { category: "Civilian", value: "Diver" },
    130000: { value: "Weapon" },
    130100: { category: "Weapon", value: "Torpedo" },
    130200: {
      category: "Weapon",
      value: "Improvised Explosive Device (IED)"
    },
    130300: { category: "Weapon", value: "Decoy" },
    140000: {
      value: "Echo Tracker Classifier (ETC)  /  Possible Contact (POSCON)"
    },
    150000: { value: "Fused Track" },
    160000: { value: "Manual Track" },
    200000: { value: "Sea Bed Installation Man-Made Military" },
    210000: { value: "Sea Bed Installation Man-Made Non-Military" }
  },
  36: {
    "000000": { value: "Unspecified" },
    110000: { value: "Sea Mine, General" },
    110100: { category: "Sea Mine, General", value: "Sea Mine, Bottom" },
    110200: { category: "Sea Mine, General", value: "Sea Mine, Moored" },
    110300: { category: "Sea Mine, General", value: "Sea Mine, Floating" },
    110400: { category: "Sea Mine, General", value: "Sea Mine, Rising" },
    110500: {
      category: "Sea Mine, General",
      value: "Sea Mine, Other Position"
    },
    110600: { category: "Sea Mine, General", value: "Kingfisher" },
    110700: {
      category: "Sea Mine, General",
      value: "Small Object, Mine-Like"
    },
    110800: {
      category: "Sea Mine, General",
      value: "Exercise Mine, General"
    },
    110801: {
      category: "Sea Mine, General - Exercise Mine, General",
      value: "Exercise Mine, Bottom"
    },
    110802: {
      category: "Sea Mine, General - Exercise Mine, General",
      value: "Exercise Mine, Moored"
    },
    110803: {
      category: "Sea Mine, General - Exercise Mine, General",
      value: "Exercise Mine, Floating"
    },
    110804: {
      category: "Sea Mine, General - Exercise Mine, General",
      value: "Exercise Mine, Rising"
    },
    110900: {
      category: "Sea Mine, General",
      value: "Neutralized Mine, General"
    },
    110901: {
      category: "Sea Mine, General - Neutralized Mine, General",
      value: "Neutralized Mine, Bottom"
    },
    110902: {
      category: "Sea Mine, General - Neutralized Mine, General",
      value: "Neutralized Mine, Moored"
    },
    110903: {
      category: "Sea Mine, General - Neutralized Mine, General",
      value: "Neutralized Mine, Floating"
    },
    110904: {
      category: "Sea Mine, General - Neutralized Mine, General",
      value: "Neutralized Mine, Rising"
    },
    110905: {
      category: "Sea Mine, General - Neutralized Mine, General",
      value: "Neutralized Mine, Other Position"
    },
    120000: { value: "Unexploded Ordnance" },
    130000: { value: "Sea Mine Decoy" },
    130100: { category: "Sea Mine Decoy", value: "Sea Mine Decoy, Bottom" },
    130200: { category: "Sea Mine Decoy", value: "Sea Mine Decoy, Moored" },
    140000: { value: "Mine-Like Contact (MILCO)" },
    140100: {
      category: "Mine-Like Contact (MILCO)",
      value: "MILCO - General"
    },
    140101: {
      category: "Mine-Like Contact (MILCO) - MILCO - General",
      value: "MILCO - General, Confidence  Level 1"
    },
    140102: {
      category: "Mine-Like Contact (MILCO) - MILCO - General",
      value: "MILCO - General, Confidence  Level 2"
    },
    140103: {
      category: "Mine-Like Contact (MILCO) - MILCO - General",
      value: "MILCO - General, Confidence  Level 3"
    },
    140104: {
      category: "Mine-Like Contact (MILCO) - MILCO - General",
      value: "MILCO - General, Confidence  Level 4"
    },
    140105: {
      category: "Mine-Like Contact (MILCO) - MILCO - General",
      value: "MILCO - General, Confidence  Level 5"
    },
    140200: {
      category: "Mine-Like Contact (MILCO)",
      value: "MILCO - Bottom"
    },
    140201: {
      category: "Mine-Like Contact (MILCO) - MILCO - Bottom",
      value: "MILCO - Bottom, Confidence  Level 1"
    },
    140202: {
      category: "Mine-Like Contact (MILCO) - MILCO - Bottom",
      value: "MILCO - Bottom, Confidence  Level 2"
    },
    140203: {
      category: "Mine-Like Contact (MILCO) - MILCO - Bottom",
      value: "MILCO - Bottom, Confidence  Level 3"
    },
    140204: {
      category: "Mine-Like Contact (MILCO) - MILCO - Bottom",
      value: "MILCO - Bottom, Confidence  Level 4"
    },
    140205: {
      category: "Mine-Like Contact (MILCO) - MILCO - Bottom",
      value: "MILCO - Bottom, Confidence  Level 5"
    },
    140300: {
      category: "Mine-Like Contact (MILCO)",
      value: "MILCO - Moored"
    },
    140301: {
      category: "Mine-Like Contact (MILCO) - MILCO - Moored",
      value: "MILCO - Moored, Confidence  Level 1"
    },
    140302: {
      category: "Mine-Like Contact (MILCO) - MILCO - Moored",
      value: "MILCO - Moored, Confidence  Level 2"
    },
    140303: {
      category: "Mine-Like Contact (MILCO) - MILCO - Moored",
      value: "MILCO - Moored, Confidence  Level 3"
    },
    140304: {
      category: "Mine-Like Contact (MILCO) - MILCO - Moored",
      value: "MILCO - Moored, Confidence  Level 4"
    },
    140305: {
      category: "Mine-Like Contact (MILCO) - MILCO - Moored",
      value: "MILCO - Moored, Confidence  Level 5"
    },
    140400: {
      category: "Mine-Like Contact (MILCO)",
      value: "MILCO - Floating"
    },
    140401: {
      category: "Mine-Like Contact (MILCO) - MILCO - Floating",
      value: "MILCO - Floating, Confidence  Level 1"
    },
    140402: {
      category: "Mine-Like Contact (MILCO) - MILCO - Floating",
      value: "MILCO - Floating, Confidence  Level 2"
    },
    140403: {
      category: "Mine-Like Contact (MILCO) - MILCO - Floating",
      value: "MILCO - Floating, Confidence  Level 3"
    },
    140404: {
      category: "Mine-Like Contact (MILCO) - MILCO - Floating",
      value: "MILCO - Floating, Confidence  Level 4"
    },
    140405: {
      category: "Mine-Like Contact (MILCO) - MILCO - Floating",
      value: "MILCO - Floating, Confidence  Level 5"
    },
    150000: { value: "Mine-Like Echo (MILEC), General" },
    150100: {
      category: "Mine-Like Echo (MILEC), General",
      value: "Mine-Like Echo, Bottom"
    },
    150200: {
      category: "Mine-Like Echo (MILEC), General",
      value: "Mine-Like Echo, Moored"
    },
    150300: {
      category: "Mine-Like Echo (MILEC), General",
      value: "Mine-Like Echo, Floating"
    },
    160000: { value: "Negative Reacquisition, General" },
    160100: {
      category: "Negative Reacquisition, General",
      value: "Negative Reacquisition, Bottom"
    },
    160200: {
      category: "Negative Reacquisition, General",
      value: "Negative Reacquisition, Moored"
    },
    160300: {
      category: "Negative Reacquisition, General",
      value: "Negative Reacquisition, Floating"
    },
    170000: { value: "Obstructor" },
    170100: { category: "Obstructor", value: "Neutralized Obstructor" },
    180000: { value: "General Mine Anchor" },
    190000: { value: "Non-Mine Mine-Like Object (NMLO), General" },
    190100: {
      category: "Non-Mine Mine-Like Object (NMLO), General",
      value: "Non-Mine Mine-Like Object, Bottom"
    },
    190200: {
      category: "Non-Mine Mine-Like Object (NMLO), General",
      value: "Non-Mine Mine-Like Object, Moored"
    },
    190300: {
      category: "Non-Mine Mine-Like Object (NMLO), General",
      value: "Non-Mine Mine-Like Object, Floating"
    },
    200000: { value: "Environmental Report Location" },
    210000: { value: "Dive Report Location" }
  },
  40: {
    "000000": { value: "Unspecified" },
    110000: { value: "Incident" },
    110100: { category: "Incident", value: "Criminal Activity Incident" },
    110101: {
      category: "Incident - Criminal Activity Incident",
      value: "Arrest"
    },
    110102: {
      category: "Incident - Criminal Activity Incident",
      value: "Arson"
    },
    110103: {
      category: "Incident - Criminal Activity Incident",
      value: "Attempted Criminal Activity"
    },
    110104: {
      category: "Incident - Criminal Activity Incident",
      value: "Drive-by Shooting"
    },
    110105: {
      category: "Incident - Criminal Activity Incident",
      value: "Drug Related"
    },
    110106: {
      category: "Incident - Criminal Activity Incident",
      value: "Extortion"
    },
    110107: {
      category: "Incident - Criminal Activity Incident",
      value: "Graffiti"
    },
    110108: {
      category: "Incident - Criminal Activity Incident",
      value: "Killing"
    },
    110109: {
      category: "Incident - Criminal Activity Incident",
      value: "Poisoning"
    },
    110110: {
      category: "Incident - Criminal Activity Incident",
      value: "Civil Rioting"
    },
    110111: {
      category: "Incident - Criminal Activity Incident",
      value: "Booby Trap"
    },
    110112: {
      category: "Incident - Criminal Activity Incident",
      value: "Home Eviction"
    },
    110113: {
      category: "Incident - Criminal Activity Incident",
      value: "Black Marketing"
    },
    110114: {
      category: "Incident - Criminal Activity Incident",
      value: "Vandalism / Loot / Ransack / Plunder"
    },
    110115: {
      category: "Incident - Criminal Activity Incident",
      value: "Jail Break"
    },
    110116: {
      category: "Incident - Criminal Activity Incident",
      value: "Robbery"
    },
    110117: {
      category: "Incident - Criminal Activity Incident",
      value: "Theft"
    },
    110118: {
      category: "Incident - Criminal Activity Incident",
      value: "Burglary"
    },
    110119: {
      category: "Incident - Criminal Activity Incident",
      value: "Smuggling"
    },
    110120: {
      category: "Incident - Criminal Activity Incident",
      value: "Rock Throwing"
    },
    110121: {
      category: "Incident - Criminal Activity Incident",
      value: "Dead Body"
    },
    110122: {
      category: "Incident - Criminal Activity Incident",
      value: "Sabotage"
    },
    110123: {
      category: "Incident - Criminal Activity Incident",
      value: "Suspicious Activity"
    },
    110200: { category: "Incident", value: "Bomb / Bombing" },
    110201: { category: "Incident - Bomb / Bombing", value: "Bomb Threat" },
    110300: { category: "Incident", value: "IED Event" },
    110301: { category: "Incident - IED Event", value: "IED Explosion" },
    110302: {
      category: "Incident - IED Event",
      value: "Premature IED Explosion"
    },
    110303: { category: "Incident - IED Event", value: "IED Cache" },
    110304: { category: "Incident - IED Event", value: "IED Suicide Bomber" },
    110400: { category: "Incident", value: "Shooting" },
    110401: { category: "Incident - Shooting", value: "Sniping" },
    110500: { category: "Incident", value: "Illegal Drug Operation" },
    110501: {
      category: "Incident - Illegal Drug Operation",
      value: "Trafficking"
    },
    110502: {
      category: "Incident - Illegal Drug Operation",
      value: "Illegal Drug Lab"
    },
    110600: { category: "Incident", value: "Explosion" },
    110601: { category: "Incident - Explosion", value: "Grenade Explosion" },
    110602: {
      category: "Incident - Explosion",
      value: "Incendiary Explosion"
    },
    110603: { category: "Incident - Explosion", value: "Mine Explosion" },
    110604: {
      category: "Incident - Explosion",
      value: "Mortar Fire Explosion"
    },
    110605: { category: "Incident - Explosion", value: "Rocket Explosion" },
    110606: { category: "Incident - Explosion", value: "Bomb Explosion" },
    120000: { value: "Civil Disturbance" },
    120100: { category: "Civil Disturbance", value: "Demonstration" },
    130000: { value: "Operation" },
    130100: { category: "Operation", value: "Patrolling" },
    130200: {
      category: "Operation",
      value: "PSYCHOLOGICAL OPERATIONS (PSYOPS)"
    },
    130201: {
      category: "Operation - PSYCHOLOGICAL OPERATIONS (PSYOPS)",
      value: "TV and Radio Propaganda"
    },
    130300: { category: "Operation", value: "Foraging / Searching" },
    130400: { category: "Operation", value: "Recruitment" },
    130401: { category: "Operation - Recruitment", value: "Willing" },
    130402: {
      category: "Operation - Recruitment",
      value: "Coerced / Impressed"
    },
    130500: { category: "Operation", value: "Mine Laying" },
    130600: { category: "Operation", value: "Spy" },
    130700: { category: "Operation", value: "Warrant Served" },
    130800: { category: "Operation", value: "Exfiltration" },
    130900: { category: "Operation", value: "Infiltration" },
    131000: { category: "Operation", value: "Meeting" },
    131001: {
      category: "Operation - Meeting",
      value: "Polling Place / Election"
    },
    131100: { category: "Operation", value: "Raid on House" },
    131200: { category: "Operation", value: "Emergency Operation" },
    131201: {
      category: "Operation - Emergency Operation",
      value: "Emergency Collection Evacuation Point"
    },
    131202: {
      category: "Operation - Emergency Operation",
      value: "Emergency Food Distribution"
    },
    131203: {
      category: "Operation - Emergency Operation",
      value: "Emergency Incident Command Centre"
    },
    131204: {
      category: "Operation - Emergency Operation",
      value: "Emergency Operations Centre"
    },
    131205: {
      category: "Operation - Emergency Operation",
      value: "Emergency Public Information Centre"
    },
    131206: {
      category: "Operation - Emergency Operation",
      value: "Emergency Shelter"
    },
    131207: {
      category: "Operation - Emergency Operation",
      value: "Emergency Staging Area"
    },
    131208: {
      category: "Operation - Emergency Operation",
      value: "Emergency Water Distribution Centre"
    },
    131300: { category: "Operation", value: "Emergency Medical Operation" },
    131301: {
      category: "Operation - Emergency Medical Operation",
      value: "EMT Station Location"
    },
    131302: {
      category: "Operation - Emergency Medical Operation",
      value: "Health Department Facility"
    },
    131303: {
      category: "Operation - Emergency Medical Operation",
      value: "Medical Facilities Outpatient"
    },
    131304: {
      category: "Operation - Emergency Medical Operation",
      value: "Morgue"
    },
    131305: {
      category: "Operation - Emergency Medical Operation",
      value: "Pharmacy"
    },
    131306: {
      category: "Operation - Emergency Medical Operation",
      value: "Triage"
    },
    131400: { category: "Operation", value: "Fire Fighting Operation" },
    131401: {
      category: "Operation - Fire Fighting Operation",
      value: "Fire Hydrant"
    },
    131402: {
      category: "Operation - Fire Fighting Operation",
      value: "Fire Station"
    },
    131403: {
      category: "Operation - Fire Fighting Operation",
      value: "Other Water Supply Location"
    },
    131500: { category: "Operation", value: "Law Enforcement Operation" },
    131501: {
      category: "Operation - Law Enforcement Operation",
      value:
        "Bureau of Alcohol, Tobacco, Firearms and Explosives (ATF) (Department of Justice)"
    },
    131502: {
      category: "Operation - Law Enforcement Operation",
      value: "Border Patrol"
    },
    131503: {
      category: "Operation - Law Enforcement Operation",
      value: "Customs Service"
    },
    131504: {
      category: "Operation - Law Enforcement Operation",
      value: "Drug Enforcement Administration (DEA)"
    },
    131505: {
      category: "Operation - Law Enforcement Operation",
      value: "Department of Justice (DOJ)"
    },
    131506: {
      category: "Operation - Law Enforcement Operation",
      value: "Federal Bureau of Investigation (FBI)"
    },
    131507: {
      category: "Operation - Law Enforcement Operation",
      value: "Police"
    },
    131508: {
      category: "Operation - Law Enforcement Operation",
      value: "Prison"
    },
    131509: {
      category: "Operation - Law Enforcement Operation",
      value: "United States Secret Service (USSS)"
    },
    131510: {
      category: "Operation - Law Enforcement Operation",
      value: "Transportation Security Administration (TSA)"
    },
    131511: {
      category: "Operation - Law Enforcement Operation",
      value: "Coast Guard"
    },
    131512: {
      category: "Operation - Law Enforcement Operation",
      value: "US Marshals Service"
    },
    131513: {
      category: "Operation - Law Enforcement Operation",
      value: "Internal Security Force"
    },
    140000: { value: "Fire Event" },
    140100: { category: "Fire Event", value: "Fire Origin" },
    140200: { category: "Fire Event", value: "Smoke" },
    140300: { category: "Fire Event", value: "Hot Spot" },
    140400: { category: "Fire Event", value: "Non-Residential Fire" },
    140500: { category: "Fire Event", value: "Residential Fire" },
    140600: { category: "Fire Event", value: "School Fire" },
    140700: { category: "Fire Event", value: "Special Needs Fire" },
    140800: { category: "Fire Event", value: "Wild Fire" },
    150000: { value: "Hazardous Materials" },
    150100: {
      category: "Hazardous Materials",
      value: "Hazardous Materials Incident"
    },
    150101: {
      category: "Hazardous Materials - Hazardous Materials Incident",
      value: "Chemical Agent"
    },
    150102: {
      category: "Hazardous Materials - Hazardous Materials Incident",
      value: "Corrosive Material"
    },
    150103: {
      category: "Hazardous Materials - Hazardous Materials Incident",
      value: "Hazardous when Wet"
    },
    150104: {
      category: "Hazardous Materials - Hazardous Materials Incident",
      value: "Explosive Material"
    },
    150105: {
      category: "Hazardous Materials - Hazardous Materials Incident",
      value: "Flammable Gas"
    },
    150106: {
      category: "Hazardous Materials - Hazardous Materials Incident",
      value: "Flammable Liquid"
    },
    150107: {
      category: "Hazardous Materials - Hazardous Materials Incident",
      value: "Flammable Solid"
    },
    150108: {
      category: "Hazardous Materials - Hazardous Materials Incident",
      value: "Non-Flammable Gas"
    },
    150109: {
      category: "Hazardous Materials - Hazardous Materials Incident",
      value: "Organic Peroxide"
    },
    150110: {
      category: "Hazardous Materials - Hazardous Materials Incident",
      value: "Oxidizer"
    },
    150111: {
      category: "Hazardous Materials - Hazardous Materials Incident",
      value: "Radioactive Material"
    },
    150112: {
      category: "Hazardous Materials - Hazardous Materials Incident",
      value: "Spontaneously Combustible Material"
    },
    150113: {
      category: "Hazardous Materials - Hazardous Materials Incident",
      value: "Toxic Gas"
    },
    150114: {
      category: "Hazardous Materials - Hazardous Materials Incident",
      value: "Toxic Infectious Material"
    },
    150115: {
      category: "Hazardous Materials - Hazardous Materials Incident",
      value: "Unexploded Ordnance"
    },
    160000: { value: "Transportation Incident" },
    160100: { category: "Transportation Incident", value: "Air" },
    160200: { category: "Transportation Incident", value: "Marine" },
    160300: { category: "Transportation Incident", value: "Rail" },
    160400: { category: "Transportation Incident", value: "Vehicle" },
    160500: {
      category: "Transportation Incident",
      value: "Wheeled Vehicle Explosion"
    },
    170000: { value: "Natural Event" },
    170100: { category: "Natural Event", value: "Geologic" },
    170101: { category: "Natural Event - Geologic", value: "Aftershock" },
    170102: { category: "Natural Event - Geologic", value: "Avalanche" },
    170103: {
      category: "Natural Event - Geologic",
      value: "Earthquake Epicentre"
    },
    170104: { category: "Natural Event - Geologic", value: "Landslide" },
    170105: { category: "Natural Event - Geologic", value: "Subsidence" },
    170106: {
      category: "Natural Event - Geologic",
      value: "Volcanic Eruption"
    },
    170107: {
      category: "Natural Event - Geologic",
      value: "Volcanic Threat"
    },
    170108: { category: "Natural Event - Geologic", value: "Cave Entrance" },
    170200: { category: "Natural Event", value: "Hydro-Meteorological" },
    170201: {
      category: "Natural Event - Hydro-Meteorological",
      value: "Drought"
    },
    170202: {
      category: "Natural Event - Hydro-Meteorological",
      value: "Flood"
    },
    170203: {
      category: "Natural Event - Hydro-Meteorological",
      value: "Tsunami"
    },
    170300: { category: "Natural Event", value: "Infestation" },
    170301: { category: "Natural Event - Infestation", value: "Bird" },
    170302: { category: "Natural Event - Infestation", value: "Insect" },
    170303: { category: "Natural Event - Infestation", value: "Microbial" },
    170304: { category: "Natural Event - Infestation", value: "Reptile" },
    170305: { category: "Natural Event - Infestation", value: "Rodent" },
    180000: { value: "Individual" },
    180100: { category: "Individual", value: "Religious Leader" },
    180200: { category: "Individual", value: "Speaker" }
  },
  50: {
    "000000": { value: "Unspecified" },
    110000: { value: "Signal Intercept" },
    110100: { category: "Signal Intercept", value: "Communications" },
    110200: { category: "Signal Intercept", value: "Jammer" },
    110300: { category: "Signal Intercept", value: "Radar" }
  },
  51: {
    "000000": { value: "Unspecified" },
    110000: { value: "Signal Intercept" },
    110100: { category: "Signal Intercept", value: "Communications" },
    110200: { category: "Signal Intercept", value: "Jammer" },
    110300: { category: "Signal Intercept", value: "Radar" }
  },
  52: {
    "000000": { value: "Unspecified" },
    110000: { value: "Signal Intercept" },
    110100: { category: "Signal Intercept", value: "Communications" },
    110200: { category: "Signal Intercept", value: "Jammer" },
    110300: { category: "Signal Intercept", value: "Radar" }
  },
  53: {
    "000000": { value: "Unspecified" },
    110000: { value: "Signal Intercept" },
    110100: { category: "Signal Intercept", value: "Communications" },
    110200: { category: "Signal Intercept", value: "Jammer" },
    110300: { category: "Signal Intercept", value: "Radar" }
  },
  54: {
    "000000": { value: "Unspecified" },
    110000: { value: "Signal Intercept" },
    110100: { category: "Signal Intercept", value: "Communications" },
    110200: { category: "Signal Intercept", value: "Jammer" },
    110300: { category: "Signal Intercept", value: "Radar" }
  },
  60: {
    "000000": { value: "Unspecified" },
    110000: { value: "Mission Force" },
    110100: { category: "Mission Force", value: "Combat Mission Team" },
    110200: { category: "Mission Force", value: "National Mission Team" },
    110300: { category: "Mission Force", value: "Cyber Protection Team" },
    110400: {
      category: "Mission Force",
      value: "Nation State Cyber Threat Actor"
    },
    110500: {
      category: "Mission Force",
      value: "Non Nation State Cyber Threat Actor"
    }
  }
}

const FirstModifierChoices = {
  "01": {
    "00": "Unspecified",
    "01": "Attack / Strike",
    "02": "Bomber",
    "03": "Cargo",
    "04": "Fighter",
    "05": "Interceptor",
    "06": "Tanker",
    "07": "Utility",
    "08": "Vertical or Short Take-off and Landing (VSTOL) /  Vertical Take-off and Landing (VTOL)",
    "09": "Passenger",
    10: "Ultra Light",
    11: "Airborne Command Post (ACP)",
    12: "Airborne Early Warning (AEW)",
    13: "Government",
    14: "Medical Evacuation (MEDEVAC)",
    15: "Escort",
    16: "Electronic Combat (EC) / Jammer",
    17: "Patrol",
    18: "Reconnaissance",
    19: "Trainer",
    20: "Photographic",
    21: "Personnel Recovery",
    22: "Antisubmarine Warfare",
    23: "Communications",
    24: "Electronic Support (ES)",
    25: "Mine Countermeasures (MCM)",
    26: "Search and Rescue",
    27: "Special Operations Forces",
    28: "Surface Warfare",
    29: "Very Important Person (VIP) Transport",
    30: "Combat Search and Rescue (CSAR)",
    31: "Suppression of Enemy Air Defenses",
    32: "Antisurface Warfare",
    33: "Fighter / Bomber",
    34: "Intensive Care",
    35: "Electronic Attack (EA)",
    36: "Multi-Mission",
    37: "Hijacking / Hijacked",
    38: "ASW Helo- LAMPS",
    39: "ASW Helo - SH-60R",
    40: "Hijacker",
    41: "Cyberspace"
  },
  "02": {
    "00": "Unspecified",
    "01": "Air",
    "02": "Surface",
    "03": "Subsurface",
    "04": "Space",
    "05": "Anti-Ballistic",
    "06": "Ballistic",
    "07": "Cruise",
    "08": "Interceptor"
  },
  "05": {
    "00": "Unspecified",
    "01": "Low Earth Orbit (LEO)",
    "02": "Medium Earth Orbit  (MEO)",
    "03": "High Earth Orbit  (HEO)",
    "04": "Geosynchronous Orbit (GSO)",
    "05": "Geostationary Orbit (GO)",
    "06": "Molniya Orbit (MO)",
    "07": "Cyberspace",
    99: "Version Extension Flag"
  },
  "06": {
    "00": "Unspecified",
    "01": "Ballistic",
    "02": "Space",
    "03": "Interceptor"
  },
  10: {
    "00": "Unspecified",
    "01": "Tactical Satellite Communications",
    "02": "Area",
    "03": "Attack",
    "04": "Biological",
    "05": "Border",
    "06": "Bridging",
    "07": "Chemical",
    "08": "Close Protection",
    "09": "Combat",
    10: "Command and Control",
    11: "Communications Contingency Package",
    12: "Construction",
    13: "Cross Cultural Communication",
    14: "Crowd and Riot Control",
    15: "Decontamination",
    16: "Detention",
    17: "Direct Communications",
    18: "Diving",
    19: "Division",
    20: "Dog",
    21: "Drilling",
    22: "Electro-Optical",
    23: "Enhanced",
    24: "Explosive Ordnance Disposal (EOD)",
    25: "Fire Direction Center",
    26: "Force",
    27: "Forward",
    28: "Ground Station Module",
    29: "Landing Support",
    30: "Large Extension Node",
    31: "Maintenance",
    32: "Meteorological",
    33: "Mine Countermeasure",
    34: "Missile",
    35: "Mobile Advisor and Support",
    36: "Mobile Subscriber Equipment",
    37: "Mobility Support",
    38: "Movement Control Centre",
    39: "Multinational",
    40: "Multinational Specialized Unit",
    41: "Multiple Rocket Launcher",
    42: "NATO Medical Role 1",
    43: "NATO Medical Role 2",
    44: "NATO Medical Role 3",
    45: "NATO Medical Role 4",
    46: "Naval",
    47: "Unmanned Aerial Systems (UAS)",
    48: "Nuclear",
    49: "Operations",
    50: "Radar",
    51: "Radio Frequency Identification (RFID) Interrogator   /   Sensor",
    52: "Radiological",
    53: "Search and Rescue",
    54: "Security",
    55: "Sensor",
    56: "Weapons",
    57: "Signals Intelligence",
    58: "Armored",
    59: "Single Rocket Launcher",
    60: "Smoke",
    61: "Sniper",
    62: "Sound Ranging",
    63: "Special Operations Forces (SOF)",
    64: "Special Weapons and Tactics",
    65: "Survey",
    66: "Tactical Exploitation",
    67: "Target Acquisition",
    68: "Topographic  /  Geospatial",
    69: "Utility",
    70: "Video Imagery (Combat Camera)",
    71: "Mobility Assault",
    72: "Amphibious Warfare Ship",
    73: "Load Handling System",
    74: "Palletized Load System",
    75: "Medevac",
    76: "Ranger",
    77: "Support",
    78: "Aviation",
    79: "Route, Reconnaissance, and Clearance",
    80: "Tilt-Rotor",
    81: "Command Post Node",
    82: "Joint Network Node",
    83: "Retransmission Site",
    84: "Assault",
    85: "Weapons",
    86: "Criminal Investigation Division",
    87: "Digital",
    88: "Network or Network Operations",
    89: "Airfield, Aerial Port of Debarkation, or Aerial Port of Embarkation",
    90: "Pipeline",
    91: "Postal",
    92: "Water",
    93: "Independent Command",
    94: "Theater",
    95: "Army or Theater Army",
    96: "Corps",
    97: "Brigade",
    98: "Headquarters or headquarters staff element"
  },
  11: {
    "00": "Unspecified",
    "01": "Assassination",
    "02": "Execution (Wrongful Killing)",
    "03": "Murder Victims",
    "04": "Hijacking",
    "05": "Kidnapping",
    "06": "Piracy",
    "07": "Rape",
    "08": "Civilian",
    "09": "Displaced Person(s), Refugee(s) and Evacuee(s)",
    10: "Foreign Fighter(s)",
    11: "Gang Member or Gang",
    12: "Government Organization",
    13: "Leader or Leadership",
    14: "Non-governmental Organization Member or Non-governmental Organization",
    15: "Coerced / Impressed Recruit",
    16: "Willing Recruit",
    17: "Religious or Religious Organization",
    18: "Targeted Individual or Organization",
    19: "Terrorist or Terrorist Organization",
    20: "Speaker",
    21: "Accident",
    22: "Combat",
    23: "Other",
    24: "Loot",
    25: "Reserved for Future Use",
    26: "Version Extension Flag"
  },
  15: {
    "00": "Unspecified",
    "01": "Biological",
    "02": "Chemical",
    "03": "Early Warning Radar",
    "04": "Intrusion",
    "05": "Nuclear",
    "06": "Radiological",
    "07": "Upgraded Early Warning Radar",
    "08": "Hijacking",
    "09": "Civilian",
    10: "Tilt-Rotor",
    12: "Multi-purpose Blade",
    13: "Tank-width Mine Plow",
    14: "Bridge",
    15: "Cyberspace",
    16: "Armored",
    17: "Attack",
    18: "Cargo",
    19: "Maintenance",
    20: "MedEvac",
    21: "Petroleum, oil, and lubricants (POL)",
    22: "Utility",
    23: "Water",
    24: "Robotic"
  },
  20: {
    "00": "Unspecified",
    "01": "Biological",
    "02": "Chemical",
    "03": "Nuclear",
    "04": "Radiological",
    "05": "Decontamination",
    "06": "Coal",
    "07": "Geothermal",
    "08": "Hydroelectric",
    "09": "Natural Gas",
    10: "Petroleum",
    11: "Civilian",
    12: "Civilian Telephone",
    13: "Civilian Television",
    14: "Cyberspace",
    15: "Joint Network Node",
    16: "Command Post Node"
  },
  // 25: "Control measure",
  27: {
    "00": "Unspecified",
    "01": "Close Protection",
    "02": "Crowd and Riot Control",
    "03": "Explosive Ordnance Disposal",
    "04": "Security",
    "05": "Sniper",
    "06": "Special Weapons and Tactics",
    "07": "Non-Governmental Organization Member",
    "08": "Multinational",
    "09": "Multinational Specialized Unit",
    10: "Governmental Organization Member",
    11: "Video Imagery (COMBAT CAMERA)",
    12: "Functional Staff Area J1",
    13: "Functional Staff Area J2",
    14: "Functional Staff Area J3",
    15: "Functional Staff Area J4",
    16: "Functional Staff Area J5",
    17: "Functional Staff Area J6",
    18: "Functional Staff Area J7",
    19: "Functional Staff Area J8",
    20: "Functional Staff Area J9",
    21: "Rank Code OF-1",
    22: "Rank Code OF-2",
    23: "Rank Code OF-3",
    24: "Rank Code OF-4",
    25: "Rank Code OF-5",
    26: "Rank Code OF-6",
    27: "Rank Code OF-7",
    28: "Rank Code OF-8",
    29: "Rank Code OF-9",
    30: "Rank Code OF-10",
    31: "Rank Code OF-D",
    32: "Rank Code OR-1",
    33: "Rank Code OR-2",
    34: "Rank Code OR-3",
    35: "Rank Code OR-4",
    36: "Rank Code OR-5",
    37: "Rank Code OR-6",
    38: "Rank Code OR-7",
    39: "Rank Code OR-8",
    40: "Rank Code OR-9",
    41: "Rank Code WO-1",
    42: "Rank Code WO-2",
    43: "Rank Code WO-3",
    44: "Rank Code WO-4",
    45: "Rank Code WO-5",
    46: "Individual",
    47: "Team / Crew",
    48: "Squad",
    49: "Section",
    50: "Platoon / Detachment",
    51: "Company",
    52: "Battalion",
    53: "Regiment / Group",
    54: "Brigade",
    55: "Division"
  },
  30: {
    "00": "Unspecified",
    "01": "Own Ship",
    "02": "Anti-air Warfare",
    "03": "Antisubmarine Warfare",
    "04": "Escort",
    "05": "Electronic Warfare",
    "06": "Intelligence, Surveillance, Reconnaissance",
    "07": "Mine Countermeasures",
    "08": "Missile Defence",
    "09": "Medical",
    10: "Mine Warfare",
    11: "Remote Multi-Mission Vehicle",
    12: "Special Operations Forces (SOF)",
    13: "Surface Warfare",
    14: "Ballistic Missile",
    15: "Guided Missile",
    16: "Other Guided Missile",
    17: "Torpedo",
    18: "Drone-Equipped",
    19: "Helicopter-Equipped / VSTOL",
    20: "Ballistic Missile Defence, Shooter",
    21: "Ballistic Missile Defence, Long-Range Surveillance and Track (LRS&T)",
    22: "Sea-Base X-Band",
    23: "Hijacking",
    24: "Reserved for Future Use",
    25: "Version Extension Flag"
  },
  35: {
    "00": "Unspecified",
    "01": "Antisubmarine Warfare",
    "02": "Auxiliary",
    "03": "Command and Control",
    "04": "Intelligence, Surveillance, Reconnaissance",
    "05": "Mine Countermeasures",
    "06": "Mine Warfare",
    "07": "Surface Warfare",
    "08": "Attack",
    "09": "Ballistic Missile",
    10: "Guided Missile",
    11: "Other Guided Missile",
    12: "Special Operations Forces (SOF)",
    13: "Possible Submarine Low 1",
    14: "Possible Submarine Low 2",
    15: "Possible Submarine High 3",
    16: "Possible Submarine High 4",
    17: "Probable Submarine",
    18: "Certain Submarine",
    19: "Anti-torpedo Torpedo",
    20: "Hijacking / Hijacked"
  },
  36: { "00": "Not Applicable" },
  40: {
    "00": "Unspecified",
    "01": "Anti-Aircraft Fire Control",
    "02": "Airborne Search and Bombing",
    "03": "Airborne Intercept",
    "04": "Altimeter",
    "05": "Airborne Reconnaissance and Mapping",
    "06": "Air Traffic Control",
    "07": "Beacon Transponder (not IFF)",
    "08": "Battlefield Surveillance",
    "09": "Controlled Approach",
    10: "Controlled Intercept",
    11: "Cellular / Mobile",
    12: "Coastal Surveillance",
    13: "Decoy / Mimic",
    14: "Data Transmission",
    15: "Earth Surveillance",
    16: "Early Warning",
    17: "Fire Control",
    18: "Ground Mapping",
    19: "Height Finding",
    20: "Harbor Surveillance",
    21: "Identification, Friend or Foe (Interrogator)",
    22: "Instrument Landing System",
    23: "Ionospheric Sounding",
    24: "Identification, Friend or Foe (Transponder)",
    25: "Barrage Jammer",
    26: "Click Jammer",
    27: "Deceptive Jammer",
    28: "Frequency Swept Jammer",
    29: "Jammer (general)",
    30: "Noise Jammer",
    31: "Pulsed Jammer",
    32: "Repeater Jammer",
    33: "Spot Noise Jammer",
    34: "Transponder Jammer",
    35: "Missile Acquisition",
    36: "Missile Control",
    37: "Missile Downlink",
    38: "Meteorological",
    39: "Multi-Function",
    40: "Missile Guidance",
    41: "Missile Homing",
    42: "Missile Tracking",
    43: "Navigational / General",
    44: "Navigational / Distance Measuring Equipment",
    45: "Navigation / Terrain Following",
    46: "Navigational / Weather Avoidance",
    47: "Omni-Line of Sight (LOS)",
    48: "Proximity Use",
    49: "Point-to-Point Line of Sight (LOS)",
    50: "Instrumentation",
    51: "Range Only",
    52: "Sonobuoy",
    53: "Satellite Downlink",
    54: "Space",
    55: "Surface Search",
    56: "Shell Tracking",
    57: "Satellite Uplink",
    58: "Target Acquisition",
    59: "Target Illumination",
    60: "Tropospheric Scatter",
    61: "Target Tracking",
    62: "Unknown",
    63: "Video Remoting",
    64: "Experimental",
    65: "Cyberspace",
    66: "{Reserved for future use}"
  },
  50: {
    "00": "Unspecified",
    "01": "Anti-Aircraft Fire Control",
    "02": "Airborne Search and Bombing",
    "03": "Airborne Intercept",
    "04": "Altimeter",
    "05": "Airborne Reconnaissance and Mapping",
    "06": "Air Traffic Control",
    "07": "Beacon Transponder (not IFF)",
    "08": "Battlefield Surveillance",
    "09": "Controlled Approach",
    10: "Controlled Intercept",
    11: "Cellular / Mobile",
    12: "Coastal Surveillance",
    13: "Decoy / Mimic",
    14: "Data Transmission",
    15: "Earth Surveillance",
    16: "Early Warning",
    17: "Fire Control",
    18: "Ground Mapping",
    19: "Height Finding",
    20: "Harbor Surveillance",
    21: "Identification, Friend or Foe (Interrogator)",
    22: "Instrument Landing System",
    23: "Ionospheric Sounding",
    24: "Identification, Friend or Foe (Transponder)",
    25: "Barrage Jammer",
    26: "Click Jammer",
    27: "Deceptive Jammer",
    28: "Frequency Swept Jammer",
    29: "Jammer (general)",
    30: "Noise Jammer",
    31: "Pulsed Jammer",
    32: "Repeater Jammer",
    33: "Spot Noise Jammer",
    34: "Transponder Jammer",
    35: "Missile Acquisition",
    36: "Missile Control",
    37: "Missile Downlink",
    38: "Meteorological",
    39: "Multi-Function",
    40: "Missile Guidance",
    41: "Missile Homing",
    42: "Missile Tracking",
    43: "Navigational / General",
    44: "Navigational / Distance Measuring Equipment",
    45: "Navigation / Terrain Following",
    46: "Navigational / Weather Avoidance",
    47: "Omni-Line of Sight (LOS)",
    48: "Proximity Use",
    49: "Point-to-Point Line of Sight (LOS)",
    50: "Instrumentation",
    51: "Range Only",
    52: "Sonobuoy",
    53: "Satellite Downlink",
    54: "Space",
    55: "Surface Search",
    56: "Shell Tracking",
    57: "Satellite Uplink",
    58: "Target Acquisition",
    59: "Target Illumination",
    60: "Tropospheric Scatter",
    61: "Target Tracking",
    62: "Unknown",
    63: "Video Remoting",
    64: "Experimental",
    65: "Cyberspace",
    66: "{Reserved for future use}"
  },
  51: {
    "00": "Unspecified",
    "01": "Anti-Aircraft Fire Control",
    "02": "Airborne Search and Bombing",
    "03": "Airborne Intercept",
    "04": "Altimeter",
    "05": "Airborne Reconnaissance and Mapping",
    "06": "Air Traffic Control",
    "07": "Beacon Transponder (not IFF)",
    "08": "Battlefield Surveillance",
    "09": "Controlled Approach",
    10: "Controlled Intercept",
    11: "Cellular / Mobile",
    12: "Coastal Surveillance",
    13: "Decoy / Mimic",
    14: "Data Transmission",
    15: "Earth Surveillance",
    16: "Early Warning",
    17: "Fire Control",
    18: "Ground Mapping",
    19: "Height Finding",
    20: "Harbor Surveillance",
    21: "Identification, Friend or Foe (Interrogator)",
    22: "Instrument Landing System",
    23: "Ionospheric Sounding",
    24: "Identification, Friend or Foe (Transponder)",
    25: "Barrage Jammer",
    26: "Click Jammer",
    27: "Deceptive Jammer",
    28: "Frequency Swept Jammer",
    29: "Jammer (general)",
    30: "Noise Jammer",
    31: "Pulsed Jammer",
    32: "Repeater Jammer",
    33: "Spot Noise Jammer",
    34: "Transponder Jammer",
    35: "Missile Acquisition",
    36: "Missile Control",
    37: "Missile Downlink",
    38: "Meteorological",
    39: "Multi-Function",
    40: "Missile Guidance",
    41: "Missile Homing",
    42: "Missile Tracking",
    43: "Navigational / General",
    44: "Navigational / Distance Measuring Equipment",
    45: "Navigation / Terrain Following",
    46: "Navigational / Weather Avoidance",
    47: "Omni-Line of Sight (LOS)",
    48: "Proximity Use",
    49: "Point-to-Point Line of Sight (LOS)",
    50: "Instrumentation",
    51: "Range Only",
    52: "Sonobuoy",
    53: "Satellite Downlink",
    54: "Space",
    55: "Surface Search",
    56: "Shell Tracking",
    57: "Satellite Uplink",
    58: "Target Acquisition",
    59: "Target Illumination",
    60: "Tropospheric Scatter",
    61: "Target Tracking",
    62: "Unknown",
    63: "Video Remoting",
    64: "Experimental",
    65: "Cyberspace",
    66: "{Reserved for future use}"
  },
  52: {
    "00": "Unspecified",
    "01": "Anti-Aircraft Fire Control",
    "02": "Airborne Search and Bombing",
    "03": "Airborne Intercept",
    "04": "Altimeter",
    "05": "Airborne Reconnaissance and Mapping",
    "06": "Air Traffic Control",
    "07": "Beacon Transponder (not IFF)",
    "08": "Battlefield Surveillance",
    "09": "Controlled Approach",
    10: "Controlled Intercept",
    11: "Cellular / Mobile",
    12: "Coastal Surveillance",
    13: "Decoy / Mimic",
    14: "Data Transmission",
    15: "Earth Surveillance",
    16: "Early Warning",
    17: "Fire Control",
    18: "Ground Mapping",
    19: "Height Finding",
    20: "Harbor Surveillance",
    21: "Identification, Friend or Foe (Interrogator)",
    22: "Instrument Landing System",
    23: "Ionospheric Sounding",
    24: "Identification, Friend or Foe (Transponder)",
    25: "Barrage Jammer",
    26: "Click Jammer",
    27: "Deceptive Jammer",
    28: "Frequency Swept Jammer",
    29: "Jammer (general)",
    30: "Noise Jammer",
    31: "Pulsed Jammer",
    32: "Repeater Jammer",
    33: "Spot Noise Jammer",
    34: "Transponder Jammer",
    35: "Missile Acquisition",
    36: "Missile Control",
    37: "Missile Downlink",
    38: "Meteorological",
    39: "Multi-Function",
    40: "Missile Guidance",
    41: "Missile Homing",
    42: "Missile Tracking",
    43: "Navigational / General",
    44: "Navigational / Distance Measuring Equipment",
    45: "Navigation / Terrain Following",
    46: "Navigational / Weather Avoidance",
    47: "Omni-Line of Sight (LOS)",
    48: "Proximity Use",
    49: "Point-to-Point Line of Sight (LOS)",
    50: "Instrumentation",
    51: "Range Only",
    52: "Sonobuoy",
    53: "Satellite Downlink",
    54: "Space",
    55: "Surface Search",
    56: "Shell Tracking",
    57: "Satellite Uplink",
    58: "Target Acquisition",
    59: "Target Illumination",
    60: "Tropospheric Scatter",
    61: "Target Tracking",
    62: "Unknown",
    63: "Video Remoting",
    64: "Experimental",
    65: "Cyberspace",
    66: "{Reserved for future use}"
  },
  53: {
    "00": "Unspecified",
    "01": "Anti-Aircraft Fire Control",
    "02": "Airborne Search and Bombing",
    "03": "Airborne Intercept",
    "04": "Altimeter",
    "05": "Airborne Reconnaissance and Mapping",
    "06": "Air Traffic Control",
    "07": "Beacon Transponder (not IFF)",
    "08": "Battlefield Surveillance",
    "09": "Controlled Approach",
    10: "Controlled Intercept",
    11: "Cellular / Mobile",
    12: "Coastal Surveillance",
    13: "Decoy / Mimic",
    14: "Data Transmission",
    15: "Earth Surveillance",
    16: "Early Warning",
    17: "Fire Control",
    18: "Ground Mapping",
    19: "Height Finding",
    20: "Harbor Surveillance",
    21: "Identification, Friend or Foe (Interrogator)",
    22: "Instrument Landing System",
    23: "Ionospheric Sounding",
    24: "Identification, Friend or Foe (Transponder)",
    25: "Barrage Jammer",
    26: "Click Jammer",
    27: "Deceptive Jammer",
    28: "Frequency Swept Jammer",
    29: "Jammer (general)",
    30: "Noise Jammer",
    31: "Pulsed Jammer",
    32: "Repeater Jammer",
    33: "Spot Noise Jammer",
    34: "Transponder Jammer",
    35: "Missile Acquisition",
    36: "Missile Control",
    37: "Missile Downlink",
    38: "Meteorological",
    39: "Multi-Function",
    40: "Missile Guidance",
    41: "Missile Homing",
    42: "Missile Tracking",
    43: "Navigational / General",
    44: "Navigational / Distance Measuring Equipment",
    45: "Navigation / Terrain Following",
    46: "Navigational / Weather Avoidance",
    47: "Omni-Line of Sight (LOS)",
    48: "Proximity Use",
    49: "Point-to-Point Line of Sight (LOS)",
    50: "Instrumentation",
    51: "Range Only",
    52: "Sonobuoy",
    53: "Satellite Downlink",
    54: "Space",
    55: "Surface Search",
    56: "Shell Tracking",
    57: "Satellite Uplink",
    58: "Target Acquisition",
    59: "Target Illumination",
    60: "Tropospheric Scatter",
    61: "Target Tracking",
    62: "Unknown",
    63: "Video Remoting",
    64: "Experimental",
    65: "Cyberspace",
    66: "{Reserved for future use}"
  },
  54: {
    "00": "Unspecified",
    "01": "Anti-Aircraft Fire Control",
    "02": "Airborne Search and Bombing",
    "03": "Airborne Intercept",
    "04": "Altimeter",
    "05": "Airborne Reconnaissance and Mapping",
    "06": "Air Traffic Control",
    "07": "Beacon Transponder (not IFF)",
    "08": "Battlefield Surveillance",
    "09": "Controlled Approach",
    10: "Controlled Intercept",
    11: "Cellular / Mobile",
    12: "Coastal Surveillance",
    13: "Decoy / Mimic",
    14: "Data Transmission",
    15: "Earth Surveillance",
    16: "Early Warning",
    17: "Fire Control",
    18: "Ground Mapping",
    19: "Height Finding",
    20: "Harbor Surveillance",
    21: "Identification, Friend or Foe (Interrogator)",
    22: "Instrument Landing System",
    23: "Ionospheric Sounding",
    24: "Identification, Friend or Foe (Transponder)",
    25: "Barrage Jammer",
    26: "Click Jammer",
    27: "Deceptive Jammer",
    28: "Frequency Swept Jammer",
    29: "Jammer (general)",
    30: "Noise Jammer",
    31: "Pulsed Jammer",
    32: "Repeater Jammer",
    33: "Spot Noise Jammer",
    34: "Transponder Jammer",
    35: "Missile Acquisition",
    36: "Missile Control",
    37: "Missile Downlink",
    38: "Meteorological",
    39: "Multi-Function",
    40: "Missile Guidance",
    41: "Missile Homing",
    42: "Missile Tracking",
    43: "Navigational / General",
    44: "Navigational / Distance Measuring Equipment",
    45: "Navigation / Terrain Following",
    46: "Navigational / Weather Avoidance",
    47: "Omni-Line of Sight (LOS)",
    48: "Proximity Use",
    49: "Point-to-Point Line of Sight (LOS)",
    50: "Instrumentation",
    51: "Range Only",
    52: "Sonobuoy",
    53: "Satellite Downlink",
    54: "Space",
    55: "Surface Search",
    56: "Shell Tracking",
    57: "Satellite Uplink",
    58: "Target Acquisition",
    59: "Target Illumination",
    60: "Tropospheric Scatter",
    61: "Target Tracking",
    62: "Unknown",
    63: "Video Remoting",
    64: "Experimental",
    65: "Cyberspace",
    66: "{Reserved for future use}"
  },
  60: { "00": "Not Applicable" }
}

const secondModifierChoices = {
  "01": {
    "00": "Unspecified",
    "01": "Heavy",
    "02": "Medium",
    "03": "Light",
    "04": "Boom-Only",
    "05": "Drogue-Only",
    "06": "Boom and Drogue",
    "07": "Close Range",
    "08": "Short Range",
    "09": "Medium Range",
    10: "Long Range",
    11: "Downlinked",
    12: "Cyberspace"
  },
  "02": {
    "00": "Unspecified",
    "01": "Air",
    "02": "Surface",
    "03": "Subsurface",
    "04": "Space",
    "05": "Launched",
    "06": "Missile",
    "07": "Patriot",
    "08": "Standard Missile-2 (SM-2)",
    "09": "Standard Missile-6 (SM-6)",
    10: "Evolved Sea Sparrow Missile (ESSM)",
    11: "Rolling Airframe Missile (RAM)",
    12: "Short Range",
    13: "Medium Range",
    14: "Intermediate Range",
    15: "Reserved for Future Use",
    16: "Intercontinental"
  },
  "05": {
    "00": "Unspecified",
    "01": "Optical",
    "02": "Infrared",
    "03": "Radar",
    "04": "Signals Intelligence (SIGINT)",
    "05": "Cyberspace",
    99: "Version Extension Flag"
  },
  "06": {
    "00": "Unspecified",
    "01": "Short Range",
    "02": "Medium Range",
    "03": "Intermediate Range",
    "04": "Long Range",
    "05": "Intercontinental",
    "06": "Arrow",
    "07": "Ground-Based Interceptor (GBI)",
    "08": "Patriot",
    "09": "Standard Missile Terminal Phase (SM-T)",
    10: "Standard Missile - 3 (SM-3)",
    11: "Terminal High Altitude Area Defense (THAAD)",
    12: "Space",
    13: "Close Range (CRBM)",
    14: "Debris",
    15: "Unknown"
  },
  10: {
    "00": "Unspecified",
    "01": "Airborne",
    "02": "Arctic",
    "03": "Battle Damage Repair",
    "04": "Bicycle Equipped",
    "05": "Casualty Staging",
    "06": "Clearing",
    "07": "Close Range",
    "08": "Control",
    "09": "Decontamination",
    10: "Demolition",
    11: "Dental",
    12: "Digital",
    13: "Enhanced Position Location Reporting System (EPLRS)",
    14: "Equipment",
    15: "Heavy",
    16: "High Altitude",
    17: "Intermodal",
    18: "Intensive Care",
    19: "Light",
    20: "Laboratory",
    21: "Launcher",
    22: "Long Range",
    23: "Low Altitude",
    24: "Medium",
    25: "Medium Altitude",
    26: "Medium Range",
    27: "Mountain",
    28: "High to Medium Altitude",
    29: "Multi-Channel",
    30: "Optical (Flash)",
    31: "Pack Animal",
    32: "Patient Evacuation Coordination",
    33: "Preventive Maintenance",
    34: "Psychological",
    35: "Radio Relay Line of Sight",
    36: "Railroad",
    37: "Recovery (Unmanned Systems)",
    38: "Recovery (Maintenance)",
    39: "Rescue Coordination Center",
    40: "Riverine",
    41: "Single Channel",
    42: "Ski",
    43: "Short Range",
    44: "Strategic",
    45: "Support",
    46: "Tactical",
    47: "Towed",
    48: "Troop",
    49: "Vertical or Short Take-Off and Landing (VTOL  /  VSTOL)",
    50: "Veterinary",
    51: "Wheeled",
    52: "High to Low Altitude",
    53: "Medium to Low Altitude",
    54: "Attack",
    55: "Refuel",
    56: "Utility",
    57: "Combat Search and Rescue",
    58: "Guerilla",
    59: "Air Assault",
    60: "Amphibious",
    61: "Very Heavy",
    62: "Supply",
    63: "Cyberspace",
    64: "Navy Barge, Self-Propelled",
    65: "Navy Barge, Not Self-Propelled",
    66: "Launch",
    67: "Landing Craft",
    68: "Landing Ship",
    69: "Service Craft  /  Yard",
    70: "Tug Harbor",
    71: "Ocean Going Tug Boat",
    72: "Surface Deployment and Distribution Command",
    73: "Noncombatant Generic Vessel",
    74: "Composite",
    75: "Shelter",
    76: "Light and Medium",
    77: "Tracked",
    78: "Security Force Assistance"
  },
  11: {
    "00": "Unspecified",
    "01": "Leader or Leadership",
    "02": "Cyberspace"
  },
  15: {
    "00": "Unspecified",
    "01": "Cyberspace",
    "02": "Light",
    "03": "Medium",
    "04": "Railway",
    "05": "Tracked",
    "06": "Tractor Trailer",
    "07": "Wheeled LTD",
    "08": "Short Range",
    "09": "Robotic"
  },
  20: {
    "00": "Unspecified",
    "01": "Biological Warfare Production",
    "02": "Chemical Warfare Production",
    "03": "Nuclear Warfare Production",
    "04": "Radiological Warfare Production",
    "05": "Atomic Energy Reactor",
    "06": "Nuclear Material Production",
    "07": "Nuclear Material Storage",
    "08": "Weapons Grade Production",
    "09": "Cyberspace"
  },
  // 25: "Control measure",
  27: {
    "00": "Unspecified",
    "01": "Airborne",
    "02": "Bicycle Equipped",
    "03": "Demolition",
    "04": "Functional Staff Area J1",
    "05": "Functional Staff Area J2",
    "06": "Functional Staff Area J3",
    "07": "Functional Staff Area J4",
    "08": "Functional Staff Area J5",
    "09": "Functional Staff Area J6",
    10: "Functional Staff Area J7",
    11: "Functional Staff Area J8",
    12: "Functional Staff Area J9",
    13: "Mountain",
    14: "Rank Code OF-1",
    15: "Rank Code OF-2",
    16: "Rank Code OF-3",
    17: "Rank Code OF-4",
    18: "Rank Code OF-5",
    19: "Rank Code OF-6",
    20: "Rank Code OF-7",
    21: "Rank Code OF-8",
    22: "Rank Code OF-9",
    23: "Rank Code OF-10",
    24: "Rank Code OF-D",
    25: "Rank Code OR-1",
    26: "Rank Code OR-2",
    27: "Rank Code OR-3",
    28: "Rank Code OR-4",
    29: "Rank Code OR-5",
    30: "Rank Code OR-6",
    31: "Rank Code OR-7",
    32: "Rank Code OR-8",
    33: "Rank Code OR-9",
    34: "Rank Code WO-1",
    35: "Rank Code WO-2",
    36: "Rank Code WO-3",
    37: "Rank Code WO-4",
    38: "Rank Code WO-5",
    39: "SKI"
  },
  30: {
    "00": "Unspecified",
    "01": "Nuclear Powered",
    "02": "Heavy",
    "03": "Light",
    "04": "Medium",
    "05": "Dock",
    "06": "Logistics",
    "07": "Tank",
    "08": "Vehicle",
    "09": "Fast",
    10: "Air-Cushioned (US)",
    11: "Air-Cushioned (NATO)",
    12: "Hydrofoil",
    13: "Autonomous Control",
    14: "Remotely Piloted",
    15: "Expendable",
    16: "Cyberspace"
  },
  35: {
    "00": "Unspecified",
    "01": "Nuclear Powered",
    "02": "Heavy",
    "03": "Light",
    "04": "Medium",
    "05": "Dock",
    "06": "Logistics",
    "07": "Tank",
    "08": "Vehicle",
    "09": "Fast",
    10: "Air-Cushioned (US)",
    11: "Air-Cushioned (NATO)",
    12: "Hydrofoil",
    13: "Autonomous Control",
    14: "Remotely Piloted",
    15: "Expendable"
  },
  36: { "00": "Not Applicable" },
  40: {
    "00": "Unspecified",
    "01": "Cyberspace"
  },
  50: {
    "00": "Unspecified",
    "01": "Cyberspace"
  },
  51: {
    "00": "Unspecified",
    "01": "Cyberspace"
  },
  52: {
    "00": "Unspecified",
    "01": "Cyberspace"
  },
  53: {
    "00": "Unspecified",
    "01": "Cyberspace"
  },
  54: {
    "00": "Unspecified",
    "01": "Cyberspace"
  },
  60: { "00": "Not Applicable" }
}

export const getChoices = (field, values) => {
  const symbolSet = getCodeFieldValue(getSymbolCode(values), "symbolSet")
  switch (field) {
    case "symbolSet":
      return SymbolSetChoices
    case "affiliation":
      return AffiliationChoices
    case "status":
      return StatusChoices
    case "hq":
      return HqChoices
    case "echelon":
      if (Object.keys(EchilonChoices).includes(symbolSet)) {
        return EchilonChoices[symbolSet]
      }
      return {}
    case "mainIcon":
      if (Object.keys(MainIconChoices).includes(symbolSet)) {
        return MainIconChoices[symbolSet]
      }
      return {}
    case "firstModifier":
      if (Object.keys(FirstModifierChoices).includes(symbolSet)) {
        return FirstModifierChoices[symbolSet]
      }
      return {}
    case "secondModifier":
      if (Object.keys(secondModifierChoices).includes(symbolSet)) {
        return secondModifierChoices[symbolSet]
      }
      return {}
    default:
      return {}
  }
}

export const getSymbolCode = values => {
  const symbolSet = values?.symbolSet || "00"
  const affiliation = values?.affiliation || "0"
  const status = values?.status || "0"
  const hq = values?.hq || "0"
  const echelon = values?.echelon || "00"
  const mainIcon = values?.mainIcon || "000000"
  const firstModifier = values?.firstModifier || "00"
  const secondModifier = values?.secondModifier || "00"
  return `${VERSION}${affiliation}${symbolSet}${status}${hq}${echelon}${mainIcon}${firstModifier}${secondModifier}`
}

const getCodeFieldValue = (code, field) => {
  switch (field) {
    case "symbolSet":
      return code.substring(4, 6)
    case "affiliation":
      return code.substring(3, 4)
    case "status":
      return code.substring(6, 7)
    case "hq":
      return code.substring(7, 8)
    case "echelon":
      return code.substring(8, 10)
    case "mainIcon":
      return code.substring(10, 16)
    case "firstModifier":
      return code.substring(16, 18)
    case "secondModifier":
      return code.substring(18, 20)
    default:
      return ""
  }
}

interface App6SymbolProps {
  code?: string
  size?: number
}

const App6Symbol = ({ code, size = 30 }: App6SymbolProps) => {
  const svgString = new ms.Symbol(code, { size }).asSVG()
  const dataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgString)}`
  return (
    <img
      src={dataUrl}
      alt="APP6 Symbol"
      style={{ maxWidth: size, maxHeight: "100%" }}
    />
  )
}

export default React.memo(App6Symbol)
