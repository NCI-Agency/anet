// This mapping was derived from APP-6D Joint Military Symbology (16 October 2017) PDF.
// and correspondes to the APP-6(D) standard for military symbology.

export const App6Choices: { [key: string]: any } = {
  app6context: {
    0: "Reality",
    1: "Exercise",
    2: "Simulation"
  },
  app6standardIdentity: {
    0: "Pending",
    1: "Unknown",
    2: "Assumed Friend",
    3: "Friend",
    4: "Neutral",
    5: "Suspect/Joker",
    6: "Hostile/Faker"
  },
  app6symbolSet: {
    "01": "Air",
    "02": "Air Missile",
    "05": "Space",
    "06": "Space Missile",
    10: "Land Unit",
    11: "Land Civilian Unit/Organization",
    15: "Land Equipment",
    20: "Land Installations",
    25: "Control Measure",
    27: "Dismounted Individual",
    30: "Sea Surface",
    35: "Sea Subsurface",
    36: "Mine Warfare",
    40: "Activity/Event",
    45: "Atmospheric (Meteorological)",
    46: "Oceanographic",
    47: "Meteorological Space",
    50: "Signals Intelligence - Space",
    51: "Signals Intelligence - Air",
    52: "Signals Intelligence - Land",
    53: "Signals Intelligence - Surface",
    54: "Signals Intelligence - Subsurface",
    60: "Cyberspace - Space",
    61: "Cyberspace - Air",
    62: "Cyberspace - Land",
    63: "Cyberspace - Surface",
    64: "Cyberspace - Subsurface",
    99: "Version Extension Flag"
  },
  app6status: {
    0: "Present",
    1: "Planned/Anticipated/Suspect",
    2: "Present/Fully Capable",
    3: "Present/Damaged",
    4: "Present/Destroyed",
    5: "Present/Full To Capacity",
    9: "Version Extension Flag"
  },
  app6hq: {
    0: "Not Applicable",
    1: "Feint/Dummy",
    2: "Headquarters",
    3: "Feint/Dummy Headquarters",
    4: "Task Force",
    5: "Feint/Dummy Task Force",
    6: "Task Force Headquarters",
    7: "Feint/Dummy Task Force Headquarters",
    9: "Version Extension Flag"
  },
  app6amplifier: {
    11: "Team/Crew",
    12: "Squad",
    13: "Section",
    14: "Platoon/Detachment",
    15: "Company/Battery/Troop",
    16: "Battalion/Squadron",
    17: "Regiment/Group",
    18: "Brigade",
    21: "Division",
    22: "Corps/Marine Expeditionary",
    23: "Army",
    24: "Army Group/Front",
    25: "Region/Theatre",
    26: "Command",
    31: "Wheeled Limited Cross Country",
    32: "Wheeled Cross Country",
    33: "Tracked",
    34: "Wheeled And Tracked",
    35: "Towed",
    36: "Rail",
    37: "Pack Animals",
    41: "Over Snow (Prime Mover)",
    42: "Sled",
    51: "Barge",
    52: "Amphibious",
    61: "Short Towed Array",
    62: "Long Towed Array",
    71: "Leader Individual",
    72: "Deputy Individual"
  },
  app6entity: {
    "01": {
      "00": {
        label: "Unspecified"
      },
      11: {
        label: "Air",
        options: {
          "01": {
            label: "Fixed Wing",
            options: {
              "01": {
                label: "Medical Evacuation (MEDEVAC)"
              },
              "02": {
                label: "Attack/Strike"
              },
              "03": {
                label: "Bomber"
              },
              "04": {
                label: "Fighter"
              },
              "05": {
                label: "Fighter/Bomber"
              },
              "07": {
                label: "Cargo"
              },
              "08": {
                label: "Electronic Combat (EC)/Jammer"
              },
              "09": {
                label: "Tanker"
              },
              10: {
                label: "Patrol"
              },
              11: {
                label: "Reconnaissance"
              },
              12: {
                label: "Trainer"
              },
              13: {
                label: "Utility"
              },
              14: {
                label: "Vertical or Short Take-off and Landing (VSTOL)"
              },
              15: {
                label: "Airborne Command Post (ACP)"
              },
              16: {
                label: "Airborne Early Warning (AEW)"
              },
              17: {
                label: "Antisurface Warfare"
              },
              18: {
                label: "Antisubmarine Warfare"
              },
              19: {
                label: "Communications"
              },
              20: {
                label: "Combat Search and Rescue (CSAR)"
              },
              21: {
                label: "Electronic Support"
              },
              22: {
                label: "Government"
              },
              23: {
                label: "Mine Countermeasures (MCM)"
              },
              24: {
                label: "Personnel Recovery"
              },
              25: {
                label: "Search and Rescue"
              },
              26: {
                label: "Special Operations Forces"
              },
              27: {
                label: "Ultra Light Photographic"
              },
              28: {
                label: "Reconnaissance"
              },
              29: {
                label: "Very Important Person (VIP)"
              },
              30: {
                label: "Suppression of Enemy Air Defence"
              },
              31: {
                label: "Passenger"
              },
              32: {
                label: "Escort"
              },
              33: {
                label: "Electronic Attack (EA)"
              }
            }
          },
          "02": {
            label: "Rotary Wing"
          },
          "03": {
            label: "Unmanned Aircraft (UA) / Unmanned Aerial Vehicle (UAV) /"
          },
          "04": {
            label: "Vertical Take-off UAV (VT-UAV)"
          },
          "05": {
            label: "Lighter Than Air"
          },
          "06": {
            label: "Airship"
          },
          "07": {
            label: "Tethered Lighter than Air"
          }
        }
      },
      12: {
        label: "Unspecified",
        options: {
          "01": {
            label: "Fixed Wing"
          },
          "02": {
            label: "Rotary Wing"
          },
          "03": {
            label:
              "Unmanned Aircraft (UA) / Unmanned Aerial Vehicle (UAV) / Unmanned Aircraft System (UAS) /"
          },
          "04": {
            label: "Remotely Piloted Vehicle (RPV) Lighter Than Air"
          },
          "05": {
            label: "Airship"
          },
          "06": {
            label: "Tethered Lighter than Air"
          }
        }
      },
      13: {
        label: "Unspecified",
        options: {
          "01": {
            label: "Bomb"
          },
          "02": {
            label: "Decoy Manual"
          }
        }
      },
      14: {
        label: "Track"
      }
    },
    "02": {
      "00": {
        label: "Unspecified"
      },
      11: {
        label: "Missile Missile"
      }
    },
    "05": {
      "00": {
        label: "Unspecified"
      },
      11: {
        label: "Military",
        options: {
          "01": {
            label: "Space Vehicle"
          },
          "02": {
            label: "Re-Entry Vehicle"
          },
          "03": {
            label: "Planet Lander"
          },
          "04": {
            label: "Orbiter Shuttle"
          },
          "05": {
            label: "Capsule"
          },
          "06": {
            label: "Satellite, General"
          },
          "07": {
            label: "Satellite"
          },
          "08": {
            label: "Antisatellite Weapon"
          },
          "09": {
            label: "Astronomical Satellite"
          },
          10: {
            label: "Biosatellite"
          },
          11: {
            label: "Communications Satellite"
          },
          12: {
            label: "Earth Observation Satellite"
          },
          13: {
            label: "Miniaturized Satellite"
          },
          14: {
            label: "Navigational Satellite"
          },
          15: {
            label: "Reconnaissance Satellite"
          },
          16: {
            label: "Space Station"
          },
          17: {
            label: "Tethered Satellite"
          },
          18: {
            label: "Weather Satellite"
          },
          19: {
            label: "Space Launched Vehicle (SLV)"
          }
        }
      },
      12: {
        label: "Unspecified",
        options: {
          "01": {
            label: "Orbiter Shuttle"
          },
          "02": {
            label: "Capsule"
          },
          "03": {
            label: "Satellite"
          },
          "04": {
            label: "Astronomical Satellite"
          },
          "05": {
            label: "Biosatellite"
          },
          "06": {
            label: "Communications Satellite"
          },
          "07": {
            label: "Earth Observation Satellite"
          },
          "08": {
            label: "Miniaturized Satellite"
          },
          "09": {
            label: "Navigational Satellite"
          },
          10: {
            label: "Space Station"
          },
          11: {
            label: "Tethered Satellite"
          },
          12: {
            label: "Weather Satellite"
          }
        }
      },
      13: {
        label: "Manual Track"
      }
    },
    10: {
      "00": {
        label: "Unspecified Command and Control"
      },
      11: {
        label: "Command and Control",
        options: {
          "01": {
            label: "Broadcast Transmitter Antennae"
          },
          "02": {
            label: "Civil Affairs"
          },
          "03": {
            label: "Civil-Military Cooperation"
          },
          "04": {
            label: "Information Operations"
          },
          "05": {
            label: "Liaison",
            options: {
              "01": {
                label: "Reconnaissance and Liaison Element"
              }
            }
          },
          "06": {
            label: "Psychological Operations (PSYOPS)",
            options: {
              "01": {
                label: "Broadcast Transmitter Antennae"
              }
            }
          },
          "07": {
            label: "Radio"
          },
          "08": {
            label: "Radio Relay"
          },
          "09": {
            label: "Radio Teletype Centre"
          },
          10: {
            label: "Signal",
            options: {
              "01": {
                label: "Radio"
              },
              "02": {
                label: "Radio Relay"
              },
              "03": {
                label: "Teletype"
              },
              "04": {
                label: "Tactical Satellite"
              },
              "05": {
                label: "Video Imagery (Combat Camera)"
              }
            }
          },
          11: {
            label: "Tactical Satellite"
          },
          12: {
            label: "Video Imagery (Combat Camera)"
          }
        }
      },
      12: {
        label: "Movement and Manoeuvre",
        options: {
          "01": {
            label: "Air Assault with Organic Lift"
          },
          "02": {
            label: "Air Traffic Services/Airfield Operations"
          },
          "03": {
            label: "Amphibious"
          },
          "04": {
            label: "Antitank/Antiaromour",
            options: {
              "01": {
                label: "Armoured"
              },
              "02": {
                label: "Motorized"
              }
            }
          },
          "05": {
            label: "Armour/Armoured/Mechanized/Self-Propelled/Tracked",
            options: {
              "01": {
                label: "Reconnaissance/Cavalry/Scout"
              },
              "02": {
                label: "Amphibious"
              }
            }
          },
          "06": {
            label: "Army Aviation/Aviation Rotary Wing",
            options: {
              "01": {
                label: "Reconnaissance"
              }
            }
          },
          "07": {
            label: "Aviation Composite"
          },
          "08": {
            label: "Aviation Fixed Wing",
            options: {
              "01": {
                label: "Reconnaissance"
              }
            }
          },
          "09": {
            label: "Combat"
          },
          10: {
            label: "Combined Arms"
          },
          11: {
            label: "Infantry",
            options: {
              "01": {
                label: "Amphibious"
              },
              "02": {
                label: "Armoured/Mechanized/Tracked"
              },
              "03": {
                label: "Main Gun System"
              },
              "04": {
                label: "Motorized"
              },
              "05": {
                label: "Mechanised Infantry with Main Gun System"
              },
              "06": {
                label: "Main Gun System/Heavy Weapon"
              }
            }
          },
          12: {
            label: "Observer"
          },
          13: {
            label: "Reconnaissance/Cavalry/Scout",
            options: {
              "01": {
                label: "Reconnaissance and Surveillance"
              },
              "02": {
                label: "Marine"
              },
              "03": {
                label: "Motorized"
              }
            }
          },
          14: {
            label: "Sea Air Land (SEAL)"
          },
          15: {
            label: "Sniper"
          },
          16: {
            label: "Surveillance"
          },
          17: {
            label: "Special Forces"
          },
          18: {
            label: "Special Operations Forces (SOF)",
            options: {
              "01": {
                label: "Fixed Wing PSYOPS"
              },
              "02": {
                label: "Ground"
              },
              "03": {
                label: "Special Boat"
              },
              "04": {
                label: "Special SSNR"
              },
              "05": {
                label: "Underwater Demolition Team"
              }
            }
          },
          19: {
            label: "Unmanned Aerial Systems"
          }
        }
      },
      13: {
        label: "Fires",
        options: {
          "01": {
            label: "Air Defence",
            options: {
              "01": {
                label: "Main Gun System"
              },
              "02": {
                label: "Missile"
              }
            }
          },
          "02": {
            label: "Air/Land Naval Gunfire Liaison"
          },
          "03": {
            label: "Field Artillery",
            options: {
              "01": {
                label: "Self-propelled"
              },
              "02": {
                label: "Target Acquisition"
              },
              "03": {
                label: "Reconnaissance"
              }
            }
          },
          "04": {
            label: "Field Artillery Observer"
          },
          "05": {
            label: "Joint Fire Support"
          },
          "06": {
            label: "Meteorological"
          },
          "07": {
            label: "Missile"
          },
          "08": {
            label: "Mortar",
            options: {
              "01": {
                label: "Armoured/Mechanized/Tracked"
              },
              "02": {
                label: "Self-Propelled Wheeled"
              },
              "03": {
                label: "Towed"
              }
            }
          },
          "09": {
            label: "Survey"
          }
        }
      },
      14: {
        label: "Protection",
        options: {
          "01": {
            label: "Chemical Biological Radiological Nuclear Defence",
            options: {
              "01": {
                label: "Mechanized"
              },
              "02": {
                label: "Motorized"
              },
              "03": {
                label: "Reconnaissance"
              },
              "04": {
                label: "Reconnaissance Armoured"
              },
              "05": {
                label: "Reconnaissance Equipped"
              }
            }
          },
          "02": {
            label: "Combat Support (Manoeuvre Enhancement)"
          },
          "03": {
            label: "Criminal Investigation Division"
          },
          "04": {
            label: "Diving"
          },
          "05": {
            label: "Dog"
          },
          "06": {
            label: "Drilling"
          },
          "07": {
            label: "Engineer",
            options: {
              "01": {
                label: "Mechanized"
              },
              "02": {
                label: "Motorized"
              },
              "03": {
                label: "Reconnaissance"
              }
            }
          },
          "08": {
            label: "Explosive Ordnance Disposal (EOD)"
          },
          "09": {
            label: "Field Camp Construction"
          },
          10: {
            label: "Fire Fighting/Fire Protection"
          },
          11: {
            label: "Geospatial Support/Geospatial Information Support"
          },
          12: {
            label: "Military Police"
          },
          13: {
            label: "Mine"
          },
          14: {
            label: "Mine Clearing"
          },
          15: {
            label: "Mine Launching"
          },
          16: {
            label: "Mine Laying"
          },
          17: {
            label: "Security",
            options: {
              "01": {
                label: "Mechanized"
              },
              "02": {
                label: "Motorized"
              }
            }
          },
          18: {
            label: "Search and Rescue"
          },
          19: {
            label: "Security Police (Air)"
          },
          20: {
            label: "Shore Patrol"
          },
          21: {
            label: "Topographic"
          }
        }
      },
      15: {
        label: "Intelligence",
        options: {
          "01": {
            label: "Analysis"
          },
          "02": {
            label: "Counterintelligence"
          },
          "03": {
            label: "Direction Finding"
          },
          "04": {
            label: "Electronic Ranging"
          },
          "05": {
            label: "Electronic Warfare",
            options: {
              "01": {
                label: "Analysis"
              },
              "02": {
                label: "Direction Finding"
              },
              "03": {
                label: "Intercept"
              },
              "04": {
                label: "Jamming"
              },
              "05": {
                label: "Search"
              }
            }
          },
          "06": {
            label: "Intercept (Search and Recording)"
          },
          "07": {
            label: "Interrogation"
          },
          "08": {
            label: "Jamming"
          },
          "09": {
            label: "Joint Intelligence Centre"
          },
          10: {
            label: "Military Intelligence"
          },
          11: {
            label: "Search"
          },
          12: {
            label: "Sensor"
          }
        }
      },
      16: {
        label: "Sustainment",
        options: {
          "01": {
            label: "Administrative"
          },
          "02": {
            label: "All Classes of Supply"
          },
          "03": {
            label: "Airport of Debarkation/Airport of Embarkation"
          },
          "04": {
            label: "Ammunition"
          },
          "05": {
            label: "Band",
            options: {
              "01": {
                label: "Army Music"
              }
            }
          },
          "06": {
            label: "Combat Service Support"
          },
          "07": {
            label: "Finance"
          },
          "08": {
            label: "Judge Advocate General"
          },
          "09": {
            label: "Labour"
          },
          10: {
            label: "Laundry/Bath"
          },
          11: {
            label: "Maintenance"
          },
          12: {
            label: "Material"
          },
          13: {
            label: "Medical"
          },
          14: {
            label: "Medical Treatment Facility"
          },
          15: {
            label: "Morale, Welfare and Recreation"
          },
          16: {
            label: "Mortuary Affairs/Graves Registration"
          },
          17: {
            label: "Multiple Classes of Supply"
          },
          18: {
            label: "NATO Supply Class I"
          },
          19: {
            label: "NATO Supply Class II"
          },
          20: {
            label: "NATO Supply Class III"
          },
          21: {
            label: "NATO Supply Class IV"
          },
          22: {
            label: "NATO Supply Class V"
          },
          23: {
            label: "Ordnance"
          },
          24: {
            label: "Personnel Services"
          },
          25: {
            label: "Petroleum, Oil and Lubricants"
          },
          26: {
            label: "Pipeline"
          },
          27: {
            label: "Postal"
          },
          28: {
            label: "Public Affairs/Public Information"
          },
          29: {
            label: "Quartermaster"
          },
          30: {
            label: "Railhead"
          },
          31: {
            label: "Religious Support"
          },
          33: {
            label: "Seaport of Debarkation/Seaport of Embarkation"
          },
          34: {
            label: "Supply"
          },
          35: {
            label: "Joint Information Bureau"
          },
          36: {
            label: "Transportation"
          },
          37: {
            label: "US Supply Class I"
          },
          38: {
            label: "US Supply Class II"
          },
          39: {
            label: "US Supply Class III"
          },
          40: {
            label: "US Supply Class IV"
          },
          41: {
            label: "US Supply Class V"
          },
          42: {
            label: "US Supply Class VI"
          },
          43: {
            label: "US Supply Class VII"
          },
          44: {
            label: "US Supply Class VIII"
          },
          45: {
            label: "US Supply Class IX"
          },
          46: {
            label: "US Supply Class X"
          },
          47: {
            label: "Water"
          },
          48: {
            label: "Water Purification"
          },
          49: {
            label: "Broadcast"
          },
          32: {
            label: "Replacement Holding Unit"
          }
        }
      },
      17: {
        label: "Naval",
        options: {
          "01": {
            label: "Naval"
          }
        }
      },
      18: {
        label: "Named Headquarters",
        options: {
          "01": {
            label: "Allied Command Europe Rapid Reaction Corps (ARRC)"
          },
          "02": {
            label: "Allied Command Operations"
          },
          "03": {
            label: "International Security Assistance Force (ISAF)"
          },
          "04": {
            label: "Multinational (MN)"
          }
        }
      },
      19: {
        label: "Emergency Operation"
      },
      20: {
        label: "Law Enforcement",
        options: {
          "01": {
            label:
              "Bureau of Alcohol, Tobacco, Firearms and Explosives (ATF) (Department of Justice)"
          },
          "02": {
            label: "Border Patrol"
          },
          "03": {
            label: "Customs Service"
          },
          "04": {
            label: "Drug Enforcement Administration (DEA)"
          },
          "05": {
            label: "Department of Justice (DOJ)"
          },
          "06": {
            label: "Federal Bureau of Investigation (FBI)"
          },
          "07": {
            label: "Police"
          },
          "08": {
            label: "Prison"
          },
          "09": {
            label: "United States Secret Service (USSS)"
          },
          10: {
            label: "Transportation Security Administration (TSA)"
          },
          11: {
            label: "Coast Guard"
          },
          12: {
            label: "US Marshals Service"
          },
          13: {
            label: "Internal Security Force"
          }
        }
      }
    },
    11: {
      "00": {
        label: "Unspecified"
      },
      11: {
        label: "Civilian",
        options: {
          "01": {
            label: "Environmental Protection"
          },
          "02": {
            label: "Government Organization"
          },
          "03": {
            label: "Individual"
          },
          "04": {
            label: "Organization or Group"
          },
          "05": {
            label: "Killing Victim"
          },
          "06": {
            label: "Killing Victims"
          },
          "07": {
            label: "Victim of an Attempted Crime"
          },
          "08": {
            label: "Spy"
          },
          "09": {
            label: "Composite Loss"
          },
          10: {
            label: "Emergency Medical Operation"
          }
        }
      }
    },
    15: {
      "00": {
        label: "Unspecified"
      },
      11: {
        label: "Weapons/Weapons System",
        options: {
          "01": {
            label: "Rifle",
            options: {
              "01": {
                label: "Single Shot Rifle"
              },
              "02": {
                label: "Semiautomatic Rifle"
              },
              "03": {
                label: "Automatic Rifle"
              }
            }
          },
          "02": {
            label: "Machine Gun",
            options: {
              "01": {
                label: "Light"
              },
              "02": {
                label: "Medium"
              },
              "03": {
                label: "Heavy"
              }
            }
          },
          "03": {
            label: "Grenade Launcher",
            options: {
              "01": {
                label: "Light"
              },
              "02": {
                label: "Medium"
              },
              "03": {
                label: "Heavy"
              }
            }
          },
          "04": {
            label: "Flame Thrower"
          },
          "05": {
            label: "Air Defence Gun",
            options: {
              "01": {
                label: "Light"
              },
              "02": {
                label: "Medium"
              },
              "03": {
                label: "Heavy"
              }
            }
          },
          "06": {
            label: "Antitank Gun",
            options: {
              "01": {
                label: "Light"
              },
              "02": {
                label: "Medium"
              },
              "03": {
                label: "Heavy"
              }
            }
          },
          "07": {
            label: "Direct Fire Gun",
            options: {
              "01": {
                label: "Light"
              },
              "02": {
                label: "Medium"
              },
              "03": {
                label: "Heavy"
              }
            }
          },
          "08": {
            label: "Recoilless Gun",
            options: {
              "01": {
                label: "Light"
              },
              "02": {
                label: "Medium"
              },
              "03": {
                label: "Heavy"
              }
            }
          },
          "09": {
            label: "Howitzer",
            options: {
              "01": {
                label: "Light"
              },
              "02": {
                label: "Medium"
              },
              "03": {
                label: "Heavy"
              }
            }
          },
          10: {
            label: "Missile Launcher",
            options: {
              "01": {
                label: "Light"
              },
              "02": {
                label: "Medium"
              },
              "03": {
                label: "Heavy"
              }
            }
          },
          11: {
            label: "Air Defence Missile Launcher",
            options: {
              "01": {
                label: "Light"
              },
              "02": {
                label: "Light, TLAR"
              },
              "03": {
                label: "Light, TELAR"
              },
              "04": {
                label: "Medium"
              },
              "05": {
                label: "Medium, TLAR"
              },
              "06": {
                label: "Medium, TELAR"
              },
              "07": {
                label: "Heavy"
              },
              "08": {
                label: "Heavy, TLAR"
              },
              "09": {
                label: "Heavy, TELAR"
              }
            }
          },
          12: {
            label: "Antitank Missile Launcher",
            options: {
              "01": {
                label: "Light"
              },
              "02": {
                label: "Medium"
              },
              "03": {
                label: "Heavy"
              }
            }
          },
          13: {
            label: "Surface-to-Surface Missile Launcher",
            options: {
              "01": {
                label: "Light"
              },
              "02": {
                label: "Medium"
              },
              "03": {
                label: "Heavy"
              }
            }
          },
          14: {
            label: "Mortar",
            options: {
              "01": {
                label: "Light"
              },
              "02": {
                label: "Medium"
              },
              "03": {
                label: "Heavy"
              }
            }
          },
          15: {
            label: "Single Rocket Launcher",
            options: {
              "01": {
                label: "Light"
              },
              "02": {
                label: "Medium"
              },
              "03": {
                label: "Heavy"
              }
            }
          },
          16: {
            label: "Multiple Rocket Launcher",
            options: {
              "01": {
                label: "Light"
              },
              "02": {
                label: "Medium"
              },
              "03": {
                label: "Heavy"
              }
            }
          },
          17: {
            label: "Antitank Rocket Launcher",
            options: {
              "01": {
                label: "Light"
              },
              "02": {
                label: "Medium"
              },
              "03": {
                label: "Heavy"
              }
            }
          },
          18: {
            label: "Non-lethal Weapon"
          },
          19: {
            label: "Taser"
          },
          20: {
            label: "Water Cannon"
          }
        }
      },
      12: {
        label: "Vehicles",
        options: {
          "01": {
            label: "Armoured",
            options: {
              "01": {
                label: "Armoured Fighting Vehicle"
              },
              "02": {
                label: "Armoured Fighting Vehicle Command and Control"
              },
              "03": {
                label: "Armoured Personnel Carrier"
              },
              "04": {
                label: "Armoured Personnel Carrier Ambulance"
              },
              "05": {
                label: "Armoured Protected Vehicle"
              },
              "06": {
                label: "Armoured Protected Vehicle Recovery"
              },
              "07": {
                label: "Armoured Protected Vehicle Medical Evacuation"
              },
              "08": {
                label: "Armoured Personnel Carrier, Recovery"
              },
              "09": {
                label: "Combat Service Support Vehicle"
              },
              10: {
                label: "Light Wheeled Armoured Vehicle"
              }
            }
          },
          "02": {
            label: "Tank",
            options: {
              "01": {
                label: "Light"
              },
              "02": {
                label: "Medium"
              },
              "03": {
                label: "Heavy"
              }
            }
          },
          "03": {
            label: "Tank Recovery Vehicle",
            options: {
              "01": {
                label: "Light"
              },
              "02": {
                label: "Medium"
              },
              "03": {
                label: "Heavy"
              }
            }
          }
        }
      },
      13: {
        label: "Engineer Vehicles and Equipment",
        options: {
          "01": {
            label: "Bridge"
          },
          "02": {
            label: "Bridge Mounted on Utility Vehicle"
          },
          "03": {
            label: "Fixed Bridge"
          },
          "04": {
            label: "Floating Bridge"
          },
          "05": {
            label: "Folding Girder Bridge"
          },
          "06": {
            label: "Hollow Deck Bridge"
          },
          "07": {
            label: "Drill",
            options: {
              "01": {
                label: "Drill Mounted on Utility Vehicle"
              }
            }
          },
          "08": {
            label: "Earthmover",
            options: {
              "01": {
                label: "Multifunctional Earthmover/Digger"
              }
            }
          },
          "09": {
            label: "Mine Clearing Equipment",
            options: {
              "01": {
                label: "Trailer Mounted"
              },
              "02": {
                label: "Mine Clearing Equipment on Tank Chassis"
              }
            }
          },
          10: {
            label: "Mine Laying Equipment",
            options: {
              "01": {
                label: "Mine Laying Equipment on Utility Vehicle"
              },
              "02": {
                label: "Armoured Carrier with Volcano"
              },
              "03": {
                label: "Truck Mounted with Volcano"
              }
            }
          },
          11: {
            label: "Dozer",
            options: {
              "01": {
                label: "Dozer, Armoured"
              }
            }
          },
          12: {
            label: "Armoured Assault"
          },
          13: {
            label: "Armoured Engineer Recon Vehicle (AERV)"
          },
          14: {
            label: "Backhoe"
          },
          15: {
            label: "Construction Vehicle"
          },
          16: {
            label: "Ferry Transporter"
          }
        }
      },
      14: {
        label: "Utility Vehicles",
        options: {
          "01": {
            label: "Utility"
          },
          "02": {
            label: "Medical"
          },
          "03": {
            label: "Medical Evacuation (MEDEVAC)"
          },
          "04": {
            label: "Mobile Emergency Physician"
          },
          "05": {
            label: "Bus"
          },
          "06": {
            label: "Semi-Trailer and Truck",
            options: {
              "01": {
                label: "Light"
              },
              "02": {
                label: "Medium"
              },
              "03": {
                label: "Heavy"
              }
            }
          },
          "07": {
            label: "Limited Cross Country Truck"
          },
          "08": {
            label: "Cross Country Truck"
          },
          "09": {
            label: "Petroleum, Oil and Lubricant"
          },
          10: {
            label: "Water"
          },
          11: {
            label: "Amphibious Utility Wheeled Vehicle"
          },
          12: {
            label: "Tow Truck",
            options: {
              "01": {
                label: "Light"
              },
              "02": {
                label: "Heavy"
              }
            }
          }
        }
      },
      15: {
        label: "Trains",
        options: {
          "01": {
            label: "Locomotive"
          },
          "02": {
            label: "Railcar"
          }
        }
      },
      16: {
        label: "Civilian Vehicles",
        options: {
          "01": {
            label: "Automobile",
            options: {
              "01": {
                label: "Compact"
              },
              "02": {
                label: "Midsize"
              },
              "03": {
                label: "Sedan"
              }
            }
          },
          "02": {
            label: "Open-Bed Truck",
            options: {
              "01": {
                label: "Pickup"
              },
              "02": {
                label: "Small"
              },
              "03": {
                label: "Large"
              }
            }
          },
          "03": {
            label: "Multiple Passenger Vehicle",
            options: {
              "01": {
                label: "Van"
              },
              "02": {
                label: "Small Bus"
              },
              "03": {
                label: "Large Bus"
              }
            }
          },
          "04": {
            label: "Utility Vehicle",
            options: {
              "01": {
                label: "Sport Utility Vehicle (SUV)"
              },
              "02": {
                label: "Small Box Truck"
              },
              "03": {
                label: "Large Box Truck"
              }
            }
          },
          "05": {
            label: "Jeep Type Vehicle",
            options: {
              "01": {
                label: "Small/Light"
              },
              "02": {
                label: "Medium"
              },
              "03": {
                label: "Large/Heavy"
              }
            }
          },
          "06": {
            label: "Tractor Trailer Truck with Box",
            options: {
              "01": {
                label: "Small/Light"
              },
              "02": {
                label: "Medium"
              },
              "03": {
                label: "Large/Heavy"
              }
            }
          },
          "07": {
            label: "Tractor Trailer Truck with Flatbed Trailer",
            options: {
              "01": {
                label: "Small/Light"
              },
              "02": {
                label: "Medium"
              },
              "03": {
                label: "Large/Heavy"
              }
            }
          },
          "08": {
            label: "Known Insurgent Vehicle"
          },
          "09": {
            label: "Drug Vehicle"
          }
        }
      },
      17: {
        label: "Law Enforcement",
        options: {
          "01": {
            label:
              "Bureau of Alcohol, Tobacco, Firearms and Explosives (ATF) (Department of Justice)"
          },
          "02": {
            label: "Border Patrol"
          },
          "03": {
            label: "Customs Service"
          },
          "04": {
            label: "Drug Enforcement Administration (DEA)"
          },
          "05": {
            label: "Department of Justice (DOJ)"
          },
          "06": {
            label: "Federal Bureau of Investigation (FBI)"
          },
          "07": {
            label: "Police"
          },
          "08": {
            label: "United States Secret Service (USSS)"
          },
          "09": {
            label: "Transportation Security Administration (TSA)"
          },
          10: {
            label: "Coast Guard"
          },
          11: {
            label: "US Marshals Service"
          }
        }
      },
      18: {
        label: "Pack Animals"
      },
      19: {
        label: "Missile Support",
        options: {
          "01": {
            label: "Transloader"
          },
          "02": {
            label: "Transporter"
          },
          "03": {
            label: "Crane/Loading Device"
          },
          "04": {
            label: "Propellant Transporter"
          },
          "05": {
            label: "Warhead Transporter"
          }
        }
      },
      20: {
        label: "Other Equipment",
        options: {
          "01": {
            label: "Antennae"
          },
          "02": {
            label: "Bomb"
          },
          "03": {
            label: "Booby Trap"
          },
          "04": {
            label: "CBRN Defence Equipment"
          },
          "05": {
            label: "Computer System"
          },
          "06": {
            label: "Command Launch Equipment (CLE)"
          },
          "07": {
            label: "Generator Set"
          },
          "08": {
            label:
              "Ground-based Midcourse Defence (GMD) Fire Control (GFC) Centre"
          },
          "09": {
            label:
              "In-Flight Interceptor Communications System (IFICS) Data Terminal (IDT)"
          },
          10: {
            label: "Laser"
          },
          11: {
            label: "Psychological Operations (PSYOPS)"
          },
          12: {
            label: "Sustainment Shipments"
          },
          13: {
            label: "Tent"
          },
          14: {
            label: "Unit Deployment Shipments"
          },
          15: {
            label: "Emergency Medical Operation",
            options: {
              "01": {
                label: "Medical Evacuation Helicopter"
              }
            }
          }
        }
      },
      21: {
        label: "Land Mines",
        options: {
          "01": {
            label: "Land Mine"
          },
          "02": {
            label: "Antipersonnel Land Mine (APL)"
          },
          "03": {
            label: "Antitank Mine"
          },
          "04": {
            label: "Improvised Explosive Device (IED)"
          },
          "05": {
            label: "Less than lethal"
          }
        }
      },
      22: {
        label: "Sensors",
        options: {
          "01": {
            label: "Sensor"
          },
          "02": {
            label: "Sensor Emplaced"
          },
          "03": {
            label: "Radar"
          }
        }
      },
      23: {
        label: "Emergency Operation",
        options: {
          "01": {
            label: "Ambulance"
          },
          "02": {
            label: "Fire Fighting/Fire Protection"
          }
        }
      },
      24: {
        label: "Manual Track"
      }
    },
    20: {
      "00": {
        label: "Unspecified"
      },
      11: {
        label: "Installation",
        options: {
          "01": {
            label: "Aircraft Production/Assembly"
          },
          "02": {
            label: "Ammunition and Explosives/Production"
          },
          "03": {
            label: "Ammunition Cache"
          },
          "04": {
            label: "Armament Production"
          },
          "05": {
            label: "Black List Location"
          },
          "06": {
            label: "Chemical, Biological, Radiological and Nuclear (CBRN)"
          },
          "07": {
            label: "Engineering Equipment Production",
            options: {
              "01": {
                label: "Bridge"
              }
            }
          },
          "08": {
            label: "Equipment Manufacture"
          },
          "09": {
            label: "Government Leadership"
          },
          10: {
            label: "Gray List Location"
          },
          11: {
            label: "Mass Grave Site"
          },
          12: {
            label: "Materiel"
          },
          13: {
            label: "Mine"
          },
          14: {
            label: "Missile and Space System Production"
          },
          15: {
            label: "Nuclear (Non CBRN Defence)"
          },
          16: {
            label: "Printed Media"
          },
          17: {
            label: "Safe House"
          },
          18: {
            label: "White List Location"
          },
          19: {
            label: "Tented Camp",
            options: {
              "01": {
                label: "Displaced Persons/Refugee/Evacuees Camp"
              },
              "02": {
                label: "Training Camp"
              }
            }
          },
          20: {
            label: "Warehouse/Storage Facility"
          },
          21: {
            label: "Law Enforcement",
            options: {
              "01": {
                label:
                  "Bureau of Alcohol, Tobacco, Firearms and Explosives (ATF) (Department of Justice)"
              },
              "02": {
                label: "Border Patrol"
              },
              "03": {
                label: "Customs Service"
              },
              "04": {
                label: "Drug Enforcement Administration (DEA)"
              },
              "05": {
                label: "Department of Justice (DOJ)"
              },
              "06": {
                label: "Federal Bureau of Investigation (FBI)"
              },
              "07": {
                label: "Police"
              },
              "08": {
                label: "Prison"
              },
              "09": {
                label: "United States Secret Service (USSS)"
              },
              10: {
                label: "Transportation Security Administration (TSA)"
              },
              11: {
                label: "Coast Guard"
              },
              12: {
                label: "US Marshals Service"
              }
            }
          },
          22: {
            label: "Emergency Operation",
            options: {
              "01": {
                label: "Fire Station"
              },
              "02": {
                label: "Emergency Medical Operation"
              }
            }
          }
        }
      },
      12: {
        label: "Infrastructure",
        options: {
          "01": {
            label: "Agriculture and Food Infrastructure",
            options: {
              "01": {
                label: "Agricultural Laboratory"
              },
              "02": {
                label: "Animal Feedlot"
              },
              "03": {
                label: "Commercial Food Distribution Centre"
              },
              "04": {
                label: "Farm/Ranch"
              },
              "05": {
                label: "Food Distribution"
              },
              "06": {
                label: "Food Production Centre"
              },
              "07": {
                label: "Food Retail"
              },
              "08": {
                label: "Grain Storage"
              }
            }
          },
          "02": {
            label: "Banking Finance and Insurance Infrastructure",
            options: {
              "01": {
                label: "ATM"
              },
              "02": {
                label: "Bank"
              },
              "03": {
                label: "Bullion Storage"
              },
              "04": {
                label: "Economic Infrastructure Asset"
              },
              "05": {
                label: "Federal Reserve Bank"
              },
              "06": {
                label: "Financial Exchange"
              },
              "07": {
                label: "Financial Services, Other"
              }
            }
          },
          "03": {
            label: "Commercial Infrastructure",
            options: {
              "01": {
                label: "Chemical Plant"
              },
              "02": {
                label: "Firearms Manufacturer"
              },
              "03": {
                label: "Firearms Retailer"
              },
              "04": {
                label: "Hazardous Material Production"
              },
              "05": {
                label: "Hazardous Material Storage"
              },
              "06": {
                label: "Industrial Site"
              },
              "07": {
                label: "Landfill"
              },
              "08": {
                label: "Pharmaceutical Manufacturer"
              },
              "09": {
                label: "Contaminated Hazardous Waste Site"
              },
              10: {
                label: "Toxic Release Inventory"
              }
            }
          },
          "04": {
            label: "Educational Facilities Infrastructure",
            options: {
              "01": {
                label: "College/University"
              },
              "02": {
                label: "School"
              }
            }
          },
          "05": {
            label: "Energy Facility Infrastructure",
            options: {
              "01": {
                label: "Electric Power"
              },
              "02": {
                label: "Generation Station"
              },
              "03": {
                label: "Natural Gas Facility"
              },
              "04": {
                label: "Petroleum Facility"
              },
              "05": {
                label: "Petroleum/Gas/Oil"
              },
              "06": {
                label: "Propane Facility"
              }
            }
          },
          "06": {
            label: "Government Site Infrastructure"
          },
          "07": {
            label: "Medical Infrastructure",
            options: {
              "01": {
                label: "Medical"
              },
              "02": {
                label: "Medical Treatment Facility (Hospital)"
              }
            }
          },
          "08": {
            label: "Military Infrastructure",
            options: {
              "01": {
                label: "Military Armoury"
              },
              "02": {
                label: "Military Base"
              }
            }
          },
          "09": {
            label: "Postal Services Infrastructure",
            options: {
              "01": {
                label: "Postal Distribution Centre"
              },
              "02": {
                label: "Post Office"
              }
            }
          },
          10: {
            label: "Public Venues Infrastructure",
            options: {
              "01": {
                label: "Enclosed Facility (Public Venue)"
              },
              "02": {
                label: "Open Facility (Public Venue)"
              },
              "03": {
                label: "Recreational Area"
              },
              "04": {
                label: "Religious Institution"
              }
            }
          },
          11: {
            label: "Special Needs Infrastructure",
            options: {
              "01": {
                label: "Adult Day Care"
              },
              "02": {
                label: "Child Day Care"
              },
              "03": {
                label: "Elder Care"
              }
            }
          },
          12: {
            label: "Telecommunications Infrastructure",
            options: {
              "01": {
                label: "Broadcast Transmitter Antennae"
              },
              "02": {
                label: "Telecommunications"
              },
              "03": {
                label: "Telecommunications Tower"
              }
            }
          },
          13: {
            label: "Transportation Infrastructure",
            options: {
              "01": {
                label: "Airport/Air Base"
              },
              "02": {
                label: "Air Traffic Control Facility"
              },
              "03": {
                label: "Bus Station"
              },
              "04": {
                label: "Ferry Terminal"
              },
              "05": {
                label: "Helicopter Landing Site"
              },
              "06": {
                label: "Maintenance Facility"
              },
              "07": {
                label: "Railhead/Railroad Station"
              },
              "08": {
                label: "Rest Stop"
              },
              "09": {
                label: "Sea Port/Naval Base"
              },
              10: {
                label: "Ship Yard"
              },
              11: {
                label: "Toll Facility"
              },
              12: {
                label: "Traffic Inspection Facility"
              },
              13: {
                label: "Tunnel"
              }
            }
          },
          14: {
            label: "Water Supply Infrastructure",
            options: {
              "01": {
                label: "Control Valve"
              },
              "02": {
                label: "Dam"
              },
              "03": {
                label: "Discharge Outfall"
              },
              "04": {
                label: "Ground Water Well"
              },
              "05": {
                label: "Pumping Station"
              },
              "06": {
                label: "Reservoir"
              },
              "07": {
                label: "Storage Tower"
              },
              "08": {
                label: "Surface Water Intake"
              },
              "09": {
                label: "Wastewater Treatment Facility"
              },
              10: {
                label: "Water"
              },
              11: {
                label: "Water Treatment"
              }
            }
          }
        }
      }
    },

    25: {
      "00": {
        label: "Unspecified"
      },
      11: {
        label: "Command and Control Lines",
        options: {
          "01": {
            label: "Boundary",
            options: {
              "01": {
                label: "Lateral"
              },
              "02": {
                label: "Forward"
              },
              "03": {
                label: "Rear"
              }
            }
          },
          "02": {
            label: "Light Line"
          },
          "03": {
            label: "Engineer Work Line"
          }
        }
      },
      12: {
        label: "Command and Control Areas",
        options: {
          "01": {
            label: "Area of Operations"
          },
          "02": {
            label: "Named Area of Interest"
          },
          "03": {
            label: "Targeted Area of Interest"
          },
          "04": {
            label: "Airfield Zone"
          },
          "05": {
            label: "Base Camp"
          },
          "06": {
            label: "Guerrilla Base"
          }
        }
      },
      13: {
        label: "Command and Control Points",
        options: {
          "01": {
            label: "Unspecified Control Point"
          },
          "02": {
            label: "Amnesty Point"
          },
          "03": {
            label: "Checkpoint"
          },
          "04": {
            label: "Centre of Main Effort"
          },
          "05": {
            label: "Contact Point"
          },
          "06": {
            label: "Coordinating Point"
          },
          "07": {
            label: "Decision Point"
          },
          "08": {
            label: "Distress Call"
          },
          "09": {
            label: "Entry Control Point"
          },
          10: {
            label: "Fly-To-Point",
            options: {
              "01": {
                label: "Sonobuoy"
              },
              "02": {
                label: "Weapon"
              },
              "03": {
                label: "Normal"
              }
            }
          },
          11: {
            label: "Linkup Point"
          },
          12: {
            label: "Passage Point"
          },
          13: {
            label: "Point of Interest",
            options: {
              "01": {
                label: "Point of Interest - Launch Event"
              }
            }
          },
          14: {
            label: "Rally Point"
          },
          15: {
            label: "Release Point"
          },
          16: {
            label: "Start Point"
          },
          17: {
            label: "Special Point"
          },
          18: {
            label: "Waypoint"
          },
          19: {
            label: "Airfield"
          }
        }
      },
      14: {
        label: "Manoeuvre Lines",
        options: {
          "01": {
            label: "Forward Line of Troops",
            options: {
              "01": {
                label: "Friendly Present"
              },
              "02": {
                label: "Friendly Planned or on Order"
              },
              "03": {
                label: "Enemy Known"
              },
              "04": {
                label: "Enemy Suspected or Templated"
              }
            }
          },
          "02": {
            label: "Line of Contact"
          },
          "03": {
            label: "Phase Line"
          },
          "04": {
            label: "Forward Edge of the Battle Area",
            options: {
              "01": {
                label: "Proposed or On Order"
              }
            }
          },
          "05": {
            label: "Principle Direction of Fire"
          },
          "06": {
            label: "Direction of Attack",
            options: {
              "01": {
                label: "Friendly Aviation"
              },
              "02": {
                label: "Friendly Direction of Main Attack"
              },
              "03": {
                label: "Friendly Direction of Supporting Attack"
              },
              "04": {
                label: "Friendly Planned or On Order"
              },
              "05": {
                label: "Feint"
              },
              "06": {
                label: "Enemy Confirmed"
              },
              "07": {
                label: "Enemy Templated or Suspected"
              }
            }
          },
          "07": {
            label: "Final Coordination Line"
          },
          "08": {
            label: "Infiltration Lane"
          },
          "09": {
            label: "Limit of Advance"
          },
          10: {
            label: "Line of Departure"
          },
          11: {
            label: "Line of Departure/Line of Contact"
          },
          12: {
            label: "Probable Line of Deployment"
          },
          13: {
            label: "Airhead Line"
          },
          14: {
            label: "Bridgehead Line (BL)"
          },
          15: {
            label: "Holding Line (HL)"
          },
          16: {
            label: "Release Line"
          },
          17: {
            label: "Ambush"
          }
        }
      },
      15: {
        label: "Manoeuvre Areas",
        options: {
          "01": {
            label: "Area",
            options: {
              "01": {
                label: "Friendly"
              },
              "02": {
                label: "Friendly Planned or On Order"
              },
              "03": {
                label: "Enemy Known or Confirmed"
              },
              "04": {
                label: "Enemy Suspected"
              }
            }
          },
          "02": {
            label: "Assembly Area (AA)"
          },
          "03": {
            label: "Occupied Assembly Area",
            options: {
              "01": {
                label: "Offset Unit"
              },
              "02": {
                label: "Offset Units"
              }
            }
          },
          "05": {
            label: "Action Area"
          },
          "06": {
            label: "Joint Tactical Action Area (JTAA)"
          },
          "07": {
            label: "Submarine Action Area (SAA)"
          },
          "08": {
            label: "Submarine-Generated Action Area (SGAA)"
          },
          "09": {
            label: "Drop Zone (DZ)"
          },
          10: {
            label: "Extraction Zone (EZ)"
          },
          11: {
            label: "Landing Zone (LZ)"
          },
          12: {
            label: "Pick-Up Zone (PZ)"
          },
          13: {
            label: "Fortified Area"
          },
          14: {
            label: "Limited Access Area"
          },
          15: {
            label: "Battle Position",
            options: {
              "02": {
                label: "Prepared (P) but not Occupied"
              },
              "03": {
                label: "Strong Point"
              },
              "04": {
                label: "Contain"
              },
              "05": {
                label: "Retain"
              }
            }
          },
          16: {
            label: "Engagement Area (EA)"
          },
          17: {
            label: "Axis of Advance",
            options: {
              "01": {
                label: "Friendly Airborne/Aviation"
              },
              "02": {
                label: "Attack Helicopter"
              },
              "03": {
                label: "Main Attack"
              },
              "04": {
                label: "Supporting Attack"
              },
              "05": {
                label: "Supporting Attack Planned or on Order"
              },
              "06": {
                label: "Feint"
              },
              "07": {
                label: "Enemy Confirmed"
              },
              "08": {
                label: "Enemy Templated or Suspected"
              }
            }
          },
          18: {
            label: "Assault Position"
          },
          19: {
            label: "Attack Position"
          },
          20: {
            label: "Objective"
          },
          21: {
            label: "Encirclement",
            options: {
              "01": {
                label: "Friendly"
              },
              "02": {
                label: "Enemy"
              }
            }
          },
          22: {
            label: "Penetration Box"
          },
          23: {
            label: "Attack by Fire Position"
          },
          24: {
            label: "Support by Fire Position"
          },
          25: {
            label: "Search Area/Reconnaissance Area"
          }
        }
      },
      16: {
        label: "Manoeuvre Points",
        options: {
          "01": {
            label: "Observation Post/Outpost (unspecified)"
          },
          "02": {
            label: "Observation Post/Outpost (specified)",
            options: {
              "01": {
                label: "Reconnaissance Outpost"
              },
              "02": {
                label: "Forward Observer Outpost"
              },
              "03": {
                label: "CBRN Observation Outpost"
              },
              "04": {
                label: "Sensor Outpost/Listening Post"
              },
              "05": {
                label: "Combat Outpost"
              }
            }
          },
          "03": {
            label: "Target Reference Point"
          },
          "04": {
            label: "Point of Departure"
          }
        }
      },
      17: {
        label: "Airspace Control (Corridors) Areas",
        options: {
          "01": {
            label: "Air Corridor",
            options: {
              "01": {
                label: "Air Corridor With Multiple Segments"
              }
            }
          },
          "02": {
            label: "Low Level Transit Route"
          },
          "03": {
            label: "Temporary Minimum-Risk Route"
          },
          "04": {
            label: "Safe Lane"
          },
          "05": {
            label: "Standard Use Army Aircraft Flight Route"
          },
          "06": {
            label: "Transit Corridor"
          },
          "07": {
            label: "Unmanned Aircraft (UA) Route Special Corridor"
          },
          "08": {
            label: "Base Defence Zone"
          },
          "09": {
            label: "High-Density Airspace Control Zone"
          },
          10: {
            label: "Restricted Operations Zone"
          },
          11: {
            label: "Air-to-Air Restricted Operating Zone"
          },
          12: {
            label: "Unmanned Aircraft Restricted Operating Zone"
          },
          13: {
            label: "Weapon Engagement Zone"
          },
          14: {
            label: "Fighter Engagement Zone"
          },
          15: {
            label: "Joint Engagement Zone"
          },
          16: {
            label: "Missile Engagement Zone"
          },
          17: {
            label: "Low Altitude Missile Engagement Zone"
          },
          18: {
            label: "High Altitude Missile Engagement Zone"
          },
          19: {
            label: "Short Range Air Defence Engagement Zone"
          },
          20: {
            label: "Weapons Free Zone"
          }
        }
      },
      18: {
        label: "Airspace Control Points",
        options: {
          "01": {
            label: "Air Control Point"
          },
          "02": {
            label: "Communications Checkpoint"
          },
          "03": {
            label: "Downed Aircraft Pick-up Point"
          },
          "04": {
            label: "Pop-up Point"
          },
          "05": {
            label: "Air Control Rendezvous"
          },
          "06": {
            label: "Tactical Air Navigation (TACAN)"
          },
          "07": {
            label: "Combat Air Patrol (CAP) Station"
          },
          "08": {
            label: "Airborne Early Warning (AEW) Station"
          },
          "09": {
            label: "ASW (Helo and F/W) Station"
          },
          10: {
            label: "Strike Initial Point"
          },
          11: {
            label: "Replenishment Station"
          },
          12: {
            label: "Tanking"
          },
          13: {
            label: "Antisubmarine Warfare, Rotary Wing"
          },
          14: {
            label: "Surface Combat Air Patrol (SUCAP) - Fixed Wing"
          },
          15: {
            label: "SUCAP - Rotary Wing"
          },
          16: {
            label: "MW - Fixed Wing"
          },
          17: {
            label: "MW - Rotary Wing"
          },
          18: {
            label: "Tomcat"
          },
          19: {
            label: "Rescue"
          },
          20: {
            label: "Unmanned Aerial System (UAS/UA)"
          },
          21: {
            label:
              "Vertical Take-off and Landing (VTOL) Tactical Unmanned Aircraft (VTUA)"
          },
          22: {
            label: "Orbit"
          },
          23: {
            label: "Orbit - Figure Eight"
          },
          24: {
            label: "Orbit - Race Track"
          },
          25: {
            label: "Orbit - Random Closed"
          }
        }
      },
      19: {
        label: "Airspace Control Lines",
        options: {
          "01": {
            label: "Identification Friend or Foe Off Line"
          },
          "02": {
            label: "Identification Friend or Foe On Line"
          }
        }
      },
      20: {
        label: "Maritime Control Areas",
        options: {
          "01": {
            label: "Launch Area",
            options: {
              "01": {
                label: "Ellipse/Circle"
              }
            }
          },
          "02": {
            label: "Defended Area",
            options: {
              "01": {
                label: "Ellipse/Circle"
              },
              "02": {
                label: "Rectangle"
              }
            }
          },
          "03": {
            label: "No Attack (NOTACK) Zone"
          },
          "04": {
            label: "Ship Area of Interest",
            options: {
              "01": {
                label: "Ellipse/Circle"
              },
              "02": {
                label: "Rectangle"
              }
            }
          },
          "05": {
            label: "Active Manoeuvre Area"
          },
          "06": {
            label: "Cued Acquisition Doctrine"
          },
          "07": {
            label: "Radar Search Doctrine"
          }
        }
      },
      21: {
        label: "Maritime Control Points",
        options: {
          "01": {
            label: "Plan Ship"
          },
          "02": {
            label: "Aim Point"
          },
          "03": {
            label: "Defended Asset"
          },
          "04": {
            label: "Drop Point"
          },
          "05": {
            label: "Entry Point"
          },
          "06": {
            label: "Air Detonation"
          },
          "07": {
            label: "Ground Zero"
          },
          "08": {
            label: "Impact Point"
          },
          "09": {
            label: "Predicted Impact Point"
          },
          10: {
            label: "Launched Torpedo"
          },
          11: {
            label: "Missile Detection Point"
          },
          12: {
            label: "Acoustic Countermeasure (Decoy)"
          },
          13: {
            label: "Electronic Countermeasures (ECM) Decoy"
          },
          14: {
            label: "Brief Contact"
          },
          15: {
            label: "Datum Lost Contact"
          },
          16: {
            label: "BT Buoy Drop"
          },
          17: {
            label: "Reported Bottomed Sub"
          },
          18: {
            label: "Moving Haven"
          },
          19: {
            label: "Screen Centre"
          },
          20: {
            label: "Lost Contact"
          },
          21: {
            label: "Sinker"
          },
          22: {
            label: "Trial Track"
          },
          23: {
            label: "Acoustic Fix"
          },
          24: {
            label: "Electromagnetic Fix"
          },
          25: {
            label: "Electromagnetic - Magnetic Anomaly Detection (MAD)"
          },
          26: {
            label: "Optical Fix"
          },
          27: {
            label: "Formation"
          },
          28: {
            label: "Harbour"
          },
          29: {
            label: "Harbour Entrance Point",
            options: {
              "01": {
                label: "A"
              },
              "02": {
                label: "Q"
              },
              "03": {
                label: "X"
              },
              "04": {
                label: "Y"
              }
            }
          },
          30: {
            label: "Dip Position"
          },
          31: {
            label: "Search"
          },
          32: {
            label: "Search Area"
          },
          33: {
            label: "Search Centre"
          },
          34: {
            label: "Navigational Reference Point"
          },
          35: {
            label: "Sonobuoy",
            options: {
              "01": {
                label: "Ambient Noise"
              },
              "02": {
                label: "Air Transportable Communication"
              },
              "03": {
                label: "Barra"
              },
              "04": {
                label: "Bathythermograph Transmitting"
              },
              "05": {
                label: "Command Active Multi-Beam (CAMBS)"
              },
              "06": {
                label:
                  "Command Active Sonobuoy Directional Command Active Sonobuoy System (CASS)"
              },
              "07": {
                label: "Directional Frequency Analysis and Recording (DIFAR)"
              },
              "08": {
                label: "Directional Command Active Sonobuoy System (DICASS)"
              },
              "09": {
                label: "Expendable Reliable Acoustic Path Sonobuoy (ERAPS)"
              },
              10: {
                label: "Expired"
              },
              11: {
                label: "Kingpin"
              },
              12: {
                label: "Low Frequency Analysis and Recording (LOFAR)"
              },
              13: {
                label: "Pattern Centre"
              },
              14: {
                label: "Range Only"
              },
              15: {
                label:
                  "Vertical Line Array Directional Frequency Analysis and Recording (DIFAR)"
              }
            }
          },
          36: {
            label: "Reference Point"
          },
          37: {
            label: "Special Point"
          },
          38: {
            label: "Navigational Reference Point (Points)"
          },
          39: {
            label: "Data Link Reference Point"
          },
          40: {
            label: "Forward Observer / Spotter Position"
          },
          41: {
            label: "Vital Area Centre"
          },
          42: {
            label: "Corridor Tab Point"
          },
          43: {
            label: "Enemy Point"
          },
          44: {
            label: "Marshall Point"
          },
          45: {
            label: "Position and Intended Movement (PIM)"
          },
          46: {
            label: "Pre-Landfall Waypoint"
          },
          47: {
            label: "Estimated Position (EP)"
          },
          48: {
            label: "Waypoint"
          },
          49: {
            label: "General Subsurface Station"
          },
          50: {
            label: "Submarine Subsurface Station"
          },
          51: {
            label: "Submarine Antisubmarine Warfare Subsurface Station"
          },
          52: {
            label: "Unmanned Underwater Vehicle Subsurface Station"
          },
          53: {
            label:
              "Antisubmarine Warfare (ASW) Unmanned Underwater Vehicle Subsurface Station"
          },
          54: {
            label: "Mine Warfare Unmanned Underwater Vehicle Subsurface Station"
          },
          55: {
            label:
              "Surface Warfare Unmanned Underwater Vehicle Subsurface Station"
          },
          56: {
            label: "General Surface Station"
          },
          57: {
            label: "Antisubmarine Warfare (ASW) Surface Station"
          },
          58: {
            label: "Mine Warfare Surface Station"
          },
          59: {
            label: "Non-Combatant Surface Station"
          },
          60: {
            label: "Picket Surface Station"
          },
          61: {
            label: "Rendezvous Surface Station"
          },
          62: {
            label: "Replenishment at Sea Surface Station"
          },
          63: {
            label: "Rescue Surface Station"
          },
          64: {
            label: "Surface Warfare Surface Station"
          },
          65: {
            label: "Unmanned Underwater Vehicle Surface Station"
          },
          66: {
            label:
              "Antisubmarine Warfare (ASW) Unmanned Underwater Vehicle Surface Station"
          },
          67: {
            label: "Mine Warfare Unmanned Underwater Vehicle Surface Station"
          },
          68: {
            label:
              "Remote Multi-Mission Vehicle Mine Warfare Unmanned Underwater Vehicle Surface Station"
          },
          69: {
            label:
              "Surface Warfare Mine Warfare Unmanned Underwater Vehicle Surface Station"
          },
          70: {
            label: "Shore Control Station"
          },
          71: {
            label: "General Route"
          },
          72: {
            label: "Diversion Route"
          },
          73: {
            label: "Position and Intended Movement (PIM) Route"
          },
          74: {
            label: "Picket Route"
          },
          75: {
            label: "Point R Route"
          },
          76: {
            label: "Rendezvous Route"
          },
          77: {
            label: "Waypoint Route"
          },
          78: {
            label: "Clutter, Stationary or Cease Reporting"
          },
          79: {
            label: "Tentative or Provisional Track"
          },
          80: {
            label: "Distressed Vessel"
          },
          81: {
            label: "Ditched Aircraft/Downed Aircraft"
          },
          82: {
            label: "Person in Water/Bailout"
          },
          83: {
            label: "Iceberg"
          },
          84: {
            label: "Navigational"
          },
          85: {
            label: "Oil Rig"
          },
          86: {
            label: "Sea Mine-Like"
          },
          87: {
            label: "Bottom Return/Non-Mine, Mine-Like Bottom Object (NOMBO)"
          },
          88: {
            label:
              "Bottom Return/Non-Mine, Mine-Like Bottom Object (NOMBO)/Installation Manmade"
          },
          89: {
            label: "Marine Life"
          },
          90: {
            label: "Sea Anomaly (Wake, Current, Knuckle)"
          },
          91: {
            label: "Bottom Return/Non-MILCO, Wreck, Dangerous"
          },
          92: {
            label: "Bottom Return/Non-MILCO, Wreck, Non Dangerous"
          }
        }
      },
      22: {
        label: "Maritime Control Lines",
        options: {
          "01": {
            label: "Bearing Line",
            options: {
              "01": {
                label: "Electronic"
              },
              "02": {
                label: "Electronic Warfare (EW)"
              },
              "03": {
                label: "Acoustic"
              },
              "04": {
                label: "Acoustic (Ambiguous)"
              },
              "05": {
                label: "Torpedo"
              },
              "06": {
                label: "Electro-Optical Intercept"
              },
              "07": {
                label: "Jammer"
              },
              "08": {
                label: "Radio Direction Finder (RDF)"
              }
            }
          }
        }
      },
      23: {
        label: "Deception",
        options: {
          "01": {
            label: "Decoy/Dummy"
          },
          "02": {
            label: "Decoy/Dummy/Feint"
          }
        }
      },
      24: {
        label: "Fires Areas",
        options: {
          "01": {
            label: "Airspace Coordination Area",
            options: {
              "01": {
                label: "Irregular"
              },
              "02": {
                label: "Rectangular"
              },
              "03": {
                label: "Circular"
              }
            }
          },
          "02": {
            label: "Free Fire Area",
            options: {
              "01": {
                label: "Irregular"
              },
              "02": {
                label: "Rectangular"
              },
              "03": {
                label: "Circular"
              }
            }
          },
          "03": {
            label: "No Fire Area",
            options: {
              "01": {
                label: "Irregular"
              },
              "02": {
                label: "Rectangular"
              },
              "03": {
                label: "Circular"
              }
            }
          },
          "04": {
            label: "Restricted Fire Area",
            options: {
              "01": {
                label: "Irregular"
              },
              "02": {
                label: "Rectangular"
              },
              "03": {
                label: "Circular"
              }
            }
          },
          "05": {
            label: "Position Area For Artillery (PAA)",
            options: {
              "01": {
                label: "Rectangular"
              },
              "02": {
                label: "Circular"
              },
              "03": {
                label: "Irregular"
              }
            }
          },
          "06": {
            label: "Point Targets",
            options: {
              "01": {
                label: "Point or Single Target"
              },
              "02": {
                label: "Nuclear Target"
              },
              "03": {
                label: "Target-Recorded"
              }
            }
          },
          "07": {
            label: "Linear Targets",
            options: {
              "01": {
                label: "Linear Target"
              },
              "02": {
                label: "Linear Smoke Target"
              },
              "03": {
                label: "Final Protective Fire (FPF)"
              }
            }
          },
          "08": {
            label: "Area Targets",
            options: {
              "01": {
                label: "Area Target"
              },
              "02": {
                label: "Rectangular Target"
              },
              "03": {
                label: "Circular Target"
              },
              "04": {
                label: "Rectangular Target - Single Target"
              },
              "05": {
                label: "Series or Groups of Targets"
              },
              "06": {
                label: "Smoke"
              },
              "08": {
                label: "Bomb Area"
              }
            }
          },
          "09": {
            label: "Fire Support Station"
          },
          10: {
            label: "Fire Support Area",
            options: {
              "01": {
                label: "Irregular"
              },
              "02": {
                label: "Rectangular"
              },
              "03": {
                label: "Circular"
              }
            }
          },
          11: {
            label: "Artillery Target Intelligence Zone",
            options: {
              "01": {
                label: "Irregular"
              },
              "02": {
                label: "Rectangular"
              },
              "03": {
                label: "Circular"
              }
            }
          },
          12: {
            label: "Call for Fire Area",
            options: {
              "01": {
                label: "Irregular"
              },
              "02": {
                label: "Rectangular"
              },
              "03": {
                label: "Circular"
              }
            }
          },
          13: {
            label: "Censor Zone",
            options: {
              "01": {
                label: "Irregular"
              },
              "02": {
                label: "Rectangular"
              },
              "03": {
                label: "Circular"
              }
            }
          },
          14: {
            label: "Critical Friendly Zone",
            options: {
              "01": {
                label: "Irregular"
              },
              "02": {
                label: "Rectangular"
              },
              "03": {
                label: "Circular"
              }
            }
          },
          15: {
            label: "Dead Space Area",
            options: {
              "01": {
                label: "Irregular"
              },
              "02": {
                label: "Rectangular"
              },
              "03": {
                label: "Circular"
              }
            }
          },
          16: {
            label: "Sensor Zone",
            options: {
              "01": {
                label: "Irregular"
              },
              "02": {
                label: "Rectangular"
              },
              "03": {
                label: "Circular"
              }
            }
          },
          17: {
            label: "Target Build-up Area",
            options: {
              "01": {
                label: "Irregular"
              },
              "02": {
                label: "Rectangular"
              },
              "03": {
                label: "Circular"
              }
            }
          },
          18: {
            label: "Target Value Area",
            options: {
              "01": {
                label: "Irregular"
              },
              "02": {
                label: "Rectangular"
              },
              "03": {
                label: "Circular"
              }
            }
          },
          19: {
            label: "Zone of Responsibility",
            options: {
              "01": {
                label: "Irregular"
              },
              "02": {
                label: "Rectangular"
              },
              "03": {
                label: "Circular"
              }
            }
          },
          20: {
            label: "Terminally Guided Munition Footprint (TGMF)"
          },
          21: {
            label: "Weapon/Sensor Range Fan, Sector"
          },
          22: {
            label: "Weapon/Sensor Range Fan, Circular"
          },
          23: {
            label: "Kill Box",
            options: {
              "01": {
                label: "Irregular, Blue"
              },
              "02": {
                label: "Rectangular, Blue"
              },
              "03": {
                label: "Circular, Blue"
              },
              "04": {
                label: "Irregular, Purple"
              },
              "05": {
                label: "Rectangular, Purple"
              },
              "06": {
                label: "Circular, Purple"
              }
            }
          }
        }
      },
      25: {
        label: "Fire Points",
        options: {
          "01": {
            label: "Firing Point"
          },
          "02": {
            label: "Hide Point"
          },
          "03": {
            label: "Launch Point"
          },
          "04": {
            label: "Reload Point"
          },
          "05": {
            label: "Survey Control Point"
          }
        }
      },
      26: {
        label: "Fire Lines",
        options: {
          "01": {
            label: "Fire Support Coordination Line (FSCL)"
          },
          "02": {
            label: "Coordinated Fire Line (CFL)"
          },
          "03": {
            label: "No Fire Line"
          },
          "04": {
            label: "Battlefield Coordination Line"
          },
          "05": {
            label: "Restrictive Fire Line"
          },
          "06": {
            label: "Munition Flight Path"
          }
        }
      },
      27: {
        label: "Protection Areas",
        options: {
          "01": {
            label: "Obstacle Belt"
          },
          "02": {
            label: "Obstacle Zone"
          },
          "03": {
            label: "Obstacle Free Zone"
          },
          "04": {
            label: "Obstacle Restricted Zone"
          },
          "05": {
            label: "Obstacle Effects",
            options: {
              "01": {
                label: "Block"
              },
              "02": {
                label: "Disrupt"
              },
              "03": {
                label: "Fix"
              },
              "04": {
                label: "Turn"
              }
            }
          },
          "06": {
            label: "Obstacle Bypass",
            options: {
              "01": {
                label: "Easy"
              },
              "02": {
                label: "Difficult"
              },
              "03": {
                label: "Impossible"
              }
            }
          },
          "07": {
            label: "Minefield",
            options: {
              "01": {
                label: "Completed"
              },
              "05": {
                label: "Dummy"
              },
              "06": {
                label: "Dummy Dynamic"
              },
              "07": {
                label: "Dynamic Depiction"
              }
            }
          },
          "08": {
            label: "Mined Area"
          },
          "09": {
            label: "Decoy Mined Area"
          },
          10: {
            label: "Fenced"
          },
          11: {
            label: "Unexploded Explosive Ordnance (UXO) Area"
          },
          12: {
            label: "Bridge or Gap"
          },
          13: {
            label: "Roadblocks, Craters and Blown Bridges",
            options: {
              "01": {
                label: "Planned"
              },
              "02": {
                label: "Explosives, State of Readiness 1 (Safe)"
              },
              "03": {
                label: "Explosives, State of Readiness 2 (armed but passable)"
              },
              "04": {
                label: "Roadblock Complete (Executed)"
              }
            }
          },
          14: {
            label: "Assault Crossing"
          },
          15: {
            label: "Bridge"
          },
          16: {
            label: "Ford Easy"
          },
          17: {
            label: "Ford Difficult"
          },
          18: {
            label: "Biological Contaminated Area",
            options: {
              "01": {
                label: "Toxic Industrial Material"
              }
            }
          },
          19: {
            label: "Chemical Contaminated Area",
            options: {
              "01": {
                label: "Toxic Industrial Material"
              }
            }
          },
          20: {
            label: "Nuclear Contaminated Area"
          },
          21: {
            label: "Radiological Contaminated Area",
            options: {
              "01": {
                label: "Toxic Industrial Material"
              }
            }
          },
          22: {
            label: "Minimum Safe Distance Zone"
          },
          23: {
            label: "Radiation Dose Rate Contour Lines"
          }
        }
      },
      28: {
        label: "Protection Points",
        options: {
          "01": {
            label: "Abatis"
          },
          "02": {
            label: "Antipersonnel Mine",
            options: {
              "01": {
                label: "Antipersonnel Mine with Directional Effects"
              }
            }
          },
          "03": {
            label: "Antitank Mine"
          },
          "04": {
            label: "Antitank Mine with Anti-handling Device"
          },
          "05": {
            label: "Wide Area Antitank Mine"
          },
          "06": {
            label: "Unspecified Mine"
          },
          "07": {
            label: "Booby Trap"
          },
          "08": {
            label: "Engineer Regulating Point"
          },
          "09": {
            label: "Shelter"
          },
          10: {
            label: "Shelter Above Ground"
          },
          11: {
            label: "Below Ground Shelter"
          },
          12: {
            label: "Fort"
          },
          13: {
            label: "Chemical Event",
            options: {
              "01": {
                label: "Toxic Industrial Material"
              }
            }
          },
          14: {
            label: "Biological Event",
            options: {
              "01": {
                label: "Toxic Industrial Material"
              }
            }
          },
          15: {
            label: "Nuclear Event"
          },
          16: {
            label: "Nuclear Fallout Producing Event"
          },
          17: {
            label: "Radiological",
            options: {
              "01": {
                label: "Toxic Industrial Material"
              }
            }
          },
          18: {
            label: "General Decontamination Point/Site",
            options: {
              "01": {
                label: "Alternate"
              },
              "02": {
                label: "Equipment"
              },
              "03": {
                label: "Troop"
              },
              "04": {
                label: "Equipment/Troop"
              },
              "05": {
                label: "Operational"
              },
              "06": {
                label: "Thorough"
              },
              "07": {
                label: "Main Equipment"
              },
              "08": {
                label: "Forward Troop"
              },
              "09": {
                label: "Wounded Personnel"
              }
            }
          },
          19: {
            label: "Tetrahedrons, Dragons Teeth, and Other Similar Obstacles",
            options: {
              "01": {
                label: "Fixed and Prefabricated"
              },
              "02": {
                label: "Movable"
              },
              "03": {
                label: "Movable and Prefabricated"
              }
            }
          },
          20: {
            label: "",
            options: {
              "01": {
                label: "Tower, Low"
              },
              "02": {
                label: "Tower, High"
              },
              "03": {
                label: "Overhead Wire"
              }
            }
          }
        }
      },
      29: {
        label: "Protection Lines",
        options: {
          "01": {
            label: "Obstacle Line"
          },
          "02": {
            label: "Antitank Obstacles",
            options: {
              "01": {
                label: "Under Construction"
              },
              "02": {
                label: "Completed"
              },
              "03": {
                label: "Reinforced, with Antitank Mines"
              },
              "04": {
                label: "Antitank Wall"
              }
            }
          },
          "03": {
            label: "Wire Obstacles",
            options: {
              "01": {
                label: "Unspecified Wire"
              },
              "02": {
                label: "Single Fence Wire"
              },
              "03": {
                label: "Double Fence Wire"
              },
              "04": {
                label: "Double Apron Fence"
              },
              "05": {
                label: "Low Wire Fence"
              },
              "06": {
                label: "High Wire Fence"
              },
              "07": {
                label: "Single Concertina"
              },
              "08": {
                label: "Double Strand Concertina"
              },
              "09": {
                label: "Triple Strand Concertina"
              }
            }
          },
          "04": {
            label: "Mine Cluster"
          },
          "05": {
            label: "Trip Wire"
          },
          "06": {
            label: "Lane"
          },
          "07": {
            label: "Ferry"
          },
          "08": {
            label: "Raft Site"
          },
          "09": {
            label: "Fortified Line"
          },
          10: {
            label: "Fortified Position"
          }
        }
      },
      30: {
        label: "Intelligence Lines",
        options: {
          "01": {
            label: "Intelligence Coordination Line"
          }
        }
      },
      31: {
        label: "Sustainment Areas",
        options: {
          "01": {
            label: "Detainee Holding Area"
          },
          "02": {
            label: "Enemy Prisoner of War Holding Area"
          },
          "03": {
            label: "Forward Arming and Refuelling Point"
          },
          "04": {
            label: "Refugee Holding Area"
          },
          "05": {
            label: "Regimental Support Area"
          },
          "06": {
            label: "Brigade Support Area"
          },
          "07": {
            label: "Division Support Area"
          }
        }
      },
      32: {
        label: "Sustainment Points",
        options: {
          "01": {
            label: "Ambulance Points",
            options: {
              "01": {
                label: "Ambulance Exchange Point"
              },
              "02": {
                label: "Ambulance Control Point"
              },
              "03": {
                label: "Ambulance Load Point"
              },
              "04": {
                label: "Ambulance Relay Point"
              }
            }
          },
          "02": {
            label: "Ammunition Supply Point"
          },
          "03": {
            label: "Ammunition Transfer and Holding Point"
          },
          "04": {
            label: "Cannibalization Point"
          },
          "05": {
            label: "Casualty Collection Point"
          },
          "06": {
            label: "Civilian Collection Point"
          },
          "07": {
            label: "Detainee Collection Point"
          },
          "08": {
            label: "Enemy Prisoner of War Collection Point"
          },
          "09": {
            label: "Logistics Release Point"
          },
          10: {
            label: "Maintenance Collection Point (MCP)"
          },
          11: {
            label: "Medical Evacuation Point (MEDEVAC) Pick-Up Point"
          },
          12: {
            label: "Rearm, Refuel and Resupply Point (R3P)"
          },
          13: {
            label: "Refuel on the Move (ROM) Point"
          },
          14: {
            label: "Traffic Control Post (TCP)"
          },
          15: {
            label: "Trailer Transfer Point (TTP)"
          },
          16: {
            label: "Unit Maintenance Collection Point (UNCP)"
          },
          17: {
            label: "General Supply Point",
            options: {
              "01": {
                label: "NATO Class I Supply Point"
              },
              "02": {
                label: "NATO Class II Supply Point"
              },
              "03": {
                label: "NATO Class III Supply Point"
              },
              "04": {
                label: "NATO Class IV Supply Point"
              },
              "05": {
                label: "NATO Class V Supply Point"
              },
              "06": {
                label: "NATO Multiple Class Supply Point"
              },
              "07": {
                label: "US Class I Supply Point"
              },
              "08": {
                label: "US Class II Supply Point"
              },
              "09": {
                label: "US Class III Supply Point"
              },
              10: {
                label: "US Class IV Supply Point"
              },
              11: {
                label: "US Class V Supply Point"
              },
              12: {
                label: "US Class VI Supply Point"
              },
              13: {
                label: "US Class VII Supply Point"
              },
              14: {
                label: "US Class VIII Supply Point"
              },
              15: {
                label: "US Class IX Supply Point"
              },
              16: {
                label: "US Class X Supply Point"
              }
            }
          },
          18: {
            label: "Medical Supply Point"
          }
        }
      },
      33: {
        label: "Sustainment Lines",
        options: {
          "01": {
            label: "Moving Convoy"
          },
          "02": {
            label: "Halted Convoy"
          },
          "03": {
            label: "Main Supply Route",
            options: {
              "01": {
                label: "One Way Traffic"
              },
              "02": {
                label: "Two Way Traffic"
              },
              "03": {
                label: "Alternating Traffic"
              }
            }
          },
          "04": {
            label: "Alternate Supply Route",
            options: {
              "01": {
                label: "One Way Traffic"
              },
              "02": {
                label: "Two Way Traffic"
              },
              "03": {
                label: "Alternating Traffic"
              }
            }
          }
        }
      },
      34: {
        label: "Mission Tasks",
        options: {
          "01": {
            label: "Block"
          },
          "02": {
            label: "Breach"
          },
          "03": {
            label: "Bypass"
          },
          "04": {
            label: "Canalize"
          },
          "05": {
            label: "Clear"
          },
          "06": {
            label: "Counterattack"
          },
          "07": {
            label: "Counterattack by Fire"
          },
          "08": {
            label: "Delay"
          },
          "09": {
            label: "Destroy"
          },
          10: {
            label: "Disrupt"
          },
          11: {
            label: "Fix"
          },
          12: {
            label: "Follow and Assume"
          },
          13: {
            label: "Follow and Support"
          },
          14: {
            label: "Interdict"
          },
          15: {
            label: "Isolate"
          },
          16: {
            label: "Neutralize"
          },
          17: {
            label: "Occupy"
          },
          18: {
            label: "Penetrate"
          },
          19: {
            label: "Relief in Place (RIP)"
          },
          20: {
            label: "Retire/Retirement"
          },
          21: {
            label: "Secure"
          },
          22: {
            label: "Security",
            options: {
              "01": {
                label: "Cover"
              },
              "02": {
                label: "Guard"
              },
              "03": {
                label: "Screen"
              }
            }
          },
          23: {
            label: "Seize"
          },
          24: {
            label: "Withdraw"
          },
          25: {
            label: "Withdraw Under Pressure"
          }
        }
      },
      35: {
        label: "Space Debris",
        options: {
          "01": {
            label: "Man Made Space Debris",
            options: {
              "01": {
                label: "Man Made Space Debris Small"
              },
              "02": {
                label: "Man Made Space Debris Medium"
              },
              "03": {
                label: "Man Made Space Debris Big"
              }
            }
          },
          "02": {
            label: "Natural Space Debris",
            options: {
              "01": {
                label: "Natural Space Debris Small"
              },
              "02": {
                label: "Natural Space Debris Medium"
              },
              "03": {
                label: "Natural Space Debris Big"
              }
            }
          }
        }
      }
    },
    27: {
      "00": {
        label: "Unspecified"
      },
      11: {
        label: "Military",
        options: {
          "01": {
            label: "Service/Branch",
            options: {
              "01": {
                label: "Infantry"
              },
              "02": {
                label: "Medical"
              },
              "03": {
                label: "Reconnaissance"
              },
              "04": {
                label: "Signal"
              }
            }
          },
          "02": {
            label: "Activity/Task",
            options: {
              "01": {
                label: "Explosive Ordnance Disposal"
              },
              "02": {
                label: "Field Artillery Observer"
              },
              "03": {
                label: "Joint Fire Support"
              },
              "04": {
                label: "Liaison"
              },
              "05": {
                label: "Messenger"
              },
              "06": {
                label: "Military Police"
              },
              "07": {
                label: "Observer"
              },
              "08": {
                label: "Security"
              },
              "09": {
                label: "Sniper"
              },
              10: {
                label: "Special Operation Forces"
              }
            }
          },
          "03": {
            label: "Lethal Weapons",
            options: {
              "01": {
                label: "Rifle"
              },
              "02": {
                label: "Single Shot Rifle"
              },
              "03": {
                label: "Semiautomatic Rifle"
              },
              "04": {
                label: "Automatic Rifle"
              },
              "05": {
                label: "Machine Gun"
              },
              "06": {
                label: "Machine Gun - Light"
              },
              "07": {
                label: "Machine Gun - Medium"
              },
              "08": {
                label: "Machine Gun - Heavy"
              },
              "09": {
                label: "Grenade Launcher"
              },
              10: {
                label: "Grenade Launcher - Light"
              },
              11: {
                label: "Grenade Launcher - Medium"
              },
              12: {
                label: "Grenade Launcher - Heavy"
              },
              13: {
                label: "Flame Thrower"
              },
              14: {
                label: "Mortar"
              },
              15: {
                label: "Single Rocket Launcher"
              },
              16: {
                label: "Antitank Rocket Launcher"
              }
            }
          },
          "04": {
            label: "Non-Lethal Weapons",
            options: {
              "01": {
                label: "Non-Lethal Weapon"
              },
              "02": {
                label: "Non-Lethal Grenade Launcher"
              },
              "03": {
                label: "Taser"
              }
            }
          }
        }
      },
      12: {
        label: "Civilian",
        options: {
          "01": {
            label: "Activity/Task",
            options: {
              "01": {
                label: "Police"
              }
            }
          }
        }
      }
    },
    30: {
      11: {
        label: "Military"
      },
      12: {
        label: "Military Combatant",
        options: {
          "01": {
            label: "Carrier"
          },
          "02": {
            label: "Surface Combatant, Line",
            options: {
              "01": {
                label: "Battleship"
              },
              "02": {
                label: "Cruiser"
              },
              "03": {
                label: "Destroyer"
              },
              "04": {
                label: "Frigate"
              },
              "05": {
                label: "Corvette"
              },
              "06": {
                label: "Littoral Combatant Ship"
              }
            }
          },
          "03": {
            label: "Amphibious Warfare Ship",
            options: {
              "01": {
                label: "Amphibious Force Flagship or Amphibious Command Ship"
              },
              "02": {
                label: "Amphibious Assault, Non-specified"
              },
              "03": {
                label: "Amphibious Assault Ship, General"
              },
              "04": {
                label: "Amphibious Assault Ship, Multipurpose"
              },
              "05": {
                label: "Amphibious Assault Ship, Helicopter"
              },
              "06": {
                label: "Amphibious Transport Dock"
              },
              "07": {
                label: "Landing Ship General"
              },
              "08": {
                label: "Landing Craft"
              }
            }
          },
          "04": {
            label: "Mine Warfare Ship, General",
            options: {
              "01": {
                label: "Mine Layer General"
              },
              "02": {
                label: "Mine Sweeper General"
              },
              "03": {
                label: "Mine Sweeper, Drone"
              },
              "04": {
                label: "Mine Hunter General"
              },
              "05": {
                label: "Mine Countermeasures Vessel, General"
              },
              "06": {
                label: "Mine Countermeasures, Support Ship"
              }
            }
          },
          "05": {
            label: "Patrol Boat General",
            options: {
              "01": {
                label: "Patrol Craft, Submarine Chaser/Escort, General"
              },
              "02": {
                label: "Patrol Ship, Gun Equipped General"
              }
            }
          },
          "06": {
            label: "Decoy"
          },
          "07": {
            label: "Unmanned Surface Water Vehicle (USV)"
          },
          "08": {
            label: "Speedboat",
            options: {
              "01": {
                label: "Rigid-Hull Inflatable Boat (RHIB)"
              }
            }
          },
          "09": {
            label: "Jet Ski"
          },
          10: {
            label: "Navy Task Organization",
            options: {
              "01": {
                label: "Navy Task Element"
              },
              "02": {
                label: "Navy Task Force"
              },
              "03": {
                label: "Navy Task Group"
              },
              "04": {
                label: "Navy Task Unit"
              },
              "05": {
                label: "Convoy"
              }
            }
          },
          11: {
            label: "Sea-Based X-Band Radar"
          }
        }
      },
      13: {
        label: "Military Non Combatant",
        options: {
          "01": {
            label: "Auxiliary Ship General",
            options: {
              "01": {
                label: "Ammunition Ship"
              },
              "02": {
                label: "Stores Ship (Naval)"
              },
              "03": {
                label: "Auxiliary Flag or Command Ship"
              },
              "04": {
                label: "Intelligence Collector"
              },
              "05": {
                label: "Oceanographic Research Ship (AGOR)"
              },
              "06": {
                label: "Survey Ship"
              },
              "07": {
                label: "Hospital Ship"
              },
              "08": {
                label: "Cargo Ship (Naval)"
              },
              "09": {
                label: "Combat Support Ship Fast (Naval)"
              },
              10: {
                label: "Oiler, Replenishment (Naval)"
              },
              11: {
                label: "Repair Ship"
              },
              12: {
                label: "Submarine Tender"
              },
              13: {
                label: "Tug, Ocean Going"
              }
            }
          },
          "02": {
            label: "Service Craft/Yard",
            options: {
              "01": {
                label: "Barge, not Self-Propelled"
              },
              "02": {
                label: "Barge, Self-Propelled"
              },
              "03": {
                label: "Tug, Harbour"
              },
              "04": {
                label: "Lighter, Torpedo Transport"
              }
            }
          }
        }
      },
      14: {
        label: "Civilian",
        options: {
          "01": {
            label: "Merchant Ship, General",
            options: {
              "01": {
                label: "Merchant Ship, Dry Cargo, Break Bulk"
              },
              "02": {
                label: "Merchant Ship, Container"
              },
              "03": {
                label: "Merchant Dredger"
              },
              "04": {
                label: "Merchant Ship, Roll-On, Roll-Off (RO/RO)"
              },
              "05": {
                label: "Merchant Ship, Car/Passenger Ferry"
              },
              "06": {
                label: "Merchant Ship, Heavy Lift"
              },
              "07": {
                label: "Hovercraft, General"
              },
              "08": {
                label: "Merchant Ship, Lash"
              },
              "09": {
                label: "Merchant Ship, Tanker"
              },
              10: {
                label: "Merchant Ship, Passenger"
              },
              11: {
                label: "Merchant Ship, Tug, Ocean Going"
              },
              12: {
                label: "Tow"
              },
              13: {
                label: "Transport Ship, Hazardous Material"
              },
              14: {
                label: "Junk/Dhow - Dhow"
              },
              15: {
                label: "Barge, not Self-Propelled"
              },
              16: {
                label: "Hospital Ship"
              }
            }
          },
          "02": {
            label: "Fishing Vessel, General",
            options: {
              "01": {
                label: "Drifter"
              },
              "02": {
                label: "Trawler"
              },
              "03": {
                label: "Merchant, Dredger"
              }
            }
          },
          "03": {
            label: "Law Enforcement Vessel"
          },
          "04": {
            label: "Leisure Craft, Sailing"
          },
          "05": {
            label: "Leisure Craft, Motorized",
            options: {
              "01": {
                label: "Rigid-Hull Inflatable Boat (RHIB)"
              },
              "02": {
                label: "Speedboat"
              }
            }
          },
          "06": {
            label: "Jet Ski"
          },
          "07": {
            label: "Unmanned Surface Water Vehicle (USV)"
          }
        }
      },
      15: {
        label: "Own Ship"
      },
      16: {
        label: "Fused Track"
      },
      17: {
        label: "Manual Track"
      }
    },
    35: {
      11: {
        label: "Military",
        options: {
          "01": {
            label: "Submarine, General",
            options: {
              "01": {
                label: "Submarine, Surfaced"
              },
              "02": {
                label: "Submarine, Snorkelling"
              },
              "03": {
                label: "Submarine, Bottomed"
              }
            }
          },
          "02": {
            label: "Other Submersible"
          },
          "03": {
            label: "Nonsubmarine"
          },
          "04": {
            label:
              "Autonomous Underwater Vehicle (AUV)/Unmanned Underwater Vehicle (UUV)"
          },
          "05": {
            label: "Diver"
          }
        }
      },
      12: {
        label: "Civilian",
        options: {
          "01": {
            label: "Submersible, General (Commercial)"
          },
          "02": {
            label:
              "Autonomous Underwater Vehicle (AUV)/Unmanned Underwater Vehicle (UUV)"
          },
          "03": {
            label: "Diver"
          }
        }
      },
      13: {
        label: "Weapon",
        options: {
          "01": {
            label: "Torpedo"
          },
          "02": {
            label: "Improvised Explosive Device (IED)"
          },
          "03": {
            label: "Decoy"
          }
        }
      },
      14: {
        label: "Echo Tracker Classifier (ETC) / Possible Contact (POSCON)"
      },
      15: {
        label: "Fused Track"
      },
      16: {
        label: "Manual Track"
      },
      20: {
        label: "Sea Bed Installation Man-Made Military"
      },
      21: {
        label: "Sea Bed Installation Man-Made Non-Military"
      }
    },
    36: {
      11: {
        label: "Sea Mine, General",
        options: {
          "01": {
            label: "Sea Mine, Bottom"
          },
          "02": {
            label: "Sea Mine, Moored"
          },
          "03": {
            label: "Sea Mine, Floating"
          },
          "04": {
            label: "Sea Mine, Rising"
          },
          "05": {
            label: "Sea Mine, Other Position"
          },
          "06": {
            label: "Kingfisher"
          },
          "07": {
            label: "Small Object, Mine-Like"
          },
          "08": {
            label: "Exercise Mine, General",
            options: {
              "01": {
                label: "Exercise Mine, Bottom"
              },
              "02": {
                label: "Exercise Mine, Moored"
              },
              "03": {
                label: "Exercise Mine, Floating"
              },
              "04": {
                label: "Exercise Mine, Rising"
              }
            }
          },
          "09": {
            label: "Neutralized Mine, General",
            options: {
              "01": {
                label: "Neutralized Mine, Bottom"
              },
              "02": {
                label: "Neutralized Mine, Moored"
              },
              "03": {
                label: "Neutralized Mine, Floating"
              },
              "04": {
                label: "Neutralized Mine, Rising"
              },
              "05": {
                label: "Neutralized Mine, Other Position"
              }
            }
          }
        }
      },
      12: {
        label: "Unexploded Ordnance"
      },
      13: {
        label: "Sea Mine Decoy",
        options: {
          "01": {
            label: "Sea Mine Decoy, Bottom"
          },
          "02": {
            label: "Sea Mine Decoy, Moored"
          }
        }
      },
      14: {
        label: "Mine-Like Contact (MILCO)",
        options: {
          "01": {
            label: "MILCO - General",
            options: {
              "01": {
                label: "MILCO - General, Confidence Level 1"
              },
              "02": {
                label: "MILCO - General, Confidence Level 2"
              },
              "03": {
                label: "MILCO - General, Confidence Level 3"
              },
              "04": {
                label: "MILCO - General, Confidence Level 4"
              },
              "05": {
                label: "MILCO - General, Confidence Level 5"
              }
            }
          },
          "02": {
            label: "MILCO - Bottom",
            options: {
              "01": {
                label: "MILCO - Bottom, Confidence Level 1"
              },
              "02": {
                label: "MILCO - Bottom, Confidence Level 2"
              },
              "03": {
                label: "MILCO - Bottom, Confidence Level 3"
              },
              "04": {
                label: "MILCO - Bottom, Confidence Level 4"
              },
              "05": {
                label: "MILCO - Bottom, Confidence Level 5"
              }
            }
          },
          "03": {
            label: "MILCO - Moored",
            options: {
              "01": {
                label: "MILCO - Moored, Confidence Level 1"
              },
              "02": {
                label: "MILCO - Moored, Confidence Level 2"
              },
              "03": {
                label: "MILCO - Moored, Confidence Level 3"
              },
              "04": {
                label: "MILCO - Moored, Confidence Level 4"
              },
              "05": {
                label: "MILCO - Moored, Confidence Level 5"
              }
            }
          },
          "04": {
            label: "MILCO - Floating",
            options: {
              "01": {
                label: "MILCO - Floating, Confidence Level 1"
              },
              "02": {
                label: "MILCO - Floating, Confidence Level 2"
              },
              "03": {
                label: "MILCO - Floating, Confidence Level 3"
              },
              "04": {
                label: "MILCO - Floating, Confidence Level 4"
              },
              "05": {
                label: "MILCO - Floating, Confidence Level 5"
              }
            }
          }
        }
      },
      15: {
        label: "Mine-Like Echo (MILEC), General",
        options: {
          "01": {
            label: "Mine-Like Echo, Bottom"
          },
          "02": {
            label: "Mine-Like Echo, Moored"
          },
          "03": {
            label: "Mine-Like Echo, Floating"
          }
        }
      },
      16: {
        label: "Negative Reacquisition, General",
        options: {
          "01": {
            label: "Negative Reacquisition, Bottom"
          },
          "02": {
            label: "Negative Reacquisition, Moored"
          },
          "03": {
            label: "Negative Reacquisition, Floating"
          }
        }
      },
      17: {
        label: "Obstructor",
        options: {
          "01": {
            label: "Neutralized Obstructor"
          }
        }
      },
      18: {
        label: "General Mine Anchor"
      },
      19: {
        label: "Non-Mine Mine-Like Object (NMLO), General",
        options: {
          "01": {
            label: "Non-Mine Mine-Like Object, Bottom"
          },
          "02": {
            label: "Non-Mine Mine-Like Object, Moored"
          },
          "03": {
            label: "Non-Mine Mine-Like Object, Floating"
          }
        }
      },
      20: {
        label: "Environmental Report Location"
      },
      21: {
        label: "Dive Report Location"
      }
    },
    40: {
      11: {
        label: "Incident",
        options: {
          "01": {
            label: "Criminal Activity Incident",
            options: {
              "01": {
                label: "Arrest"
              },
              "02": {
                label: "Arson"
              },
              "03": {
                label: "Attempted Criminal Activity"
              },
              "04": {
                label: "Drive-by Shooting"
              },
              "05": {
                label: "Drug Related"
              },
              "06": {
                label: "Extortion"
              },
              "07": {
                label: "Graffiti"
              },
              "08": {
                label: "Killing"
              },
              "09": {
                label: "Poisoning"
              },
              10: {
                label: "Civil Rioting"
              },
              11: {
                label: "Booby Trap"
              },
              12: {
                label: "Home Eviction"
              },
              13: {
                label: "Black Marketing"
              },
              14: {
                label: "Vandalism/Loot/Ransack/Plunder"
              },
              15: {
                label: "Jail Break"
              },
              16: {
                label: "Robbery"
              },
              17: {
                label: "Theft"
              },
              18: {
                label: "Burglary"
              },
              19: {
                label: "Smuggling"
              },
              20: {
                label: "Rock Throwing"
              },
              21: {
                label: "Dead Body"
              },
              22: {
                label: "Sabotage"
              },
              23: {
                label: "Suspicious Activity"
              }
            }
          },
          "02": {
            label: "Bomb/Bombing",
            options: {
              "01": {
                label: "Bomb Threat"
              }
            }
          },
          "03": {
            label: "IED Event",
            options: {
              "01": {
                label: "IED Explosion"
              },
              "02": {
                label: "Premature IED Explosion"
              },
              "03": {
                label: "IED Cache"
              },
              "04": {
                label: "IED Suicide Bomber"
              }
            }
          },
          "04": {
            label: "Shooting",
            options: {
              "01": {
                label: "Sniping"
              }
            }
          },
          "05": {
            label: "Illegal Drug Operation",
            options: {
              "01": {
                label: "Trafficking"
              },
              "02": {
                label: "Illegal Drug Lab"
              }
            }
          },
          "06": {
            label: "Explosion",
            options: {
              "01": {
                label: "Grenade Explosion"
              },
              "02": {
                label: "Incendiary Explosion"
              },
              "03": {
                label: "Mine Explosion"
              },
              "04": {
                label: "Mortar Fire Explosion"
              },
              "05": {
                label: "Rocket Explosion"
              },
              "06": {
                label: "Bomb Explosion"
              }
            }
          }
        }
      },
      12: {
        label: "Civil Disturbance",
        options: {
          "01": {
            label: "Demonstration"
          }
        }
      },
      13: {
        label: "Operation",
        options: {
          "01": {
            label: "Patrolling"
          },
          "02": {
            label: "Psychological Operations (PSYOPS)",
            options: {
              "01": {
                label: "TV and Radio Propaganda"
              }
            }
          },
          "03": {
            label: "Foraging/Searching"
          },
          "04": {
            label: "Recruitment",
            options: {
              "01": {
                label: "Willing"
              },
              "02": {
                label: "Coerced/Impressed"
              }
            }
          },
          "05": {
            label: "Mine Laying"
          },
          "06": {
            label: "Spy"
          },
          "07": {
            label: "Warrant Served"
          },
          "08": {
            label: "Exfiltration"
          },
          "09": {
            label: "Infiltration"
          },
          10: {
            label: "Meeting",
            options: {
              "01": {
                label: "Polling Place/Election"
              }
            }
          },
          11: {
            label: "Raid on House"
          },
          12: {
            label: "Emergency Operation",
            options: {
              "01": {
                label: "Emergency Collection Evacuation Point"
              },
              "02": {
                label: "Emergency Food Distribution"
              },
              "03": {
                label: "Emergency Incident Command Centre"
              },
              "04": {
                label: "Emergency Operations Centre"
              },
              "05": {
                label: "Emergency Public Information Centre"
              },
              "06": {
                label: "Emergency Shelter"
              },
              "07": {
                label: "Emergency Staging Area"
              },
              "08": {
                label: "Emergency Water Distribution Centre"
              }
            }
          },
          13: {
            label: "Emergency Medical Operation",
            options: {
              "01": {
                label: "EMT Station Location"
              },
              "02": {
                label: "Health Department Facility"
              },
              "03": {
                label: "Medical Facilities Outpatient"
              },
              "04": {
                label: "Morgue"
              },
              "05": {
                label: "Pharmacy"
              },
              "06": {
                label: "Triage"
              }
            }
          },
          14: {
            label: "Fire Fighting Operation",
            options: {
              "01": {
                label: "Fire Hydrant"
              },
              "02": {
                label: "Fire Station"
              },
              "03": {
                label: "Other Water Supply Location"
              }
            }
          },
          15: {
            label: "Law Enforcement Operation",
            options: {
              "01": {
                label:
                  "Bureau of Alcohol, Tobacco, Firearms and Explosives (ATF) (Department of Justice)"
              },
              "02": {
                label: "Border Patrol"
              },
              "03": {
                label: "Customs Service"
              },
              "04": {
                label: "Drug Enforcement Administration (DEA)"
              },
              "05": {
                label: "Department of Justice (DOJ)"
              },
              "06": {
                label: "Federal Bureau of Investigation (FBI)"
              },
              "07": {
                label: "Police"
              },
              "08": {
                label: "Prison"
              },
              "09": {
                label: "United States Secret Service (USSS)"
              },
              10: {
                label: "Transportation Security Administration (TSA)"
              },
              11: {
                label: "Coast Guard"
              },
              12: {
                label: "US Marshals Service"
              },
              13: {
                label: "Internal Security Force"
              }
            }
          }
        }
      },
      14: {
        label: "Fire Event",
        options: {
          "01": {
            label: "Fire Origin"
          },
          "02": {
            label: "Smoke"
          },
          "03": {
            label: "Hot Spot"
          },
          "04": {
            label: "Non-Residential Fire"
          },
          "05": {
            label: "Residential Fire"
          },
          "06": {
            label: "School Fire"
          },
          "07": {
            label: "Special Needs Fire"
          },
          "08": {
            label: "Wild Fire"
          }
        }
      },
      15: {
        label: "Hazardous Materials",
        options: {
          "01": {
            label: "Hazardous Materials Incident",
            options: {
              "01": {
                label: "Chemical Agent"
              },
              "02": {
                label: "Corrosive Material"
              },
              "03": {
                label: "Hazardous when Wet"
              },
              "04": {
                label: "Explosive Material"
              },
              "05": {
                label: "Flammable Gas"
              },
              "06": {
                label: "Flammable Liquid"
              },
              "07": {
                label: "Flammable Solid"
              },
              "08": {
                label: "Non-Flammable Gas"
              },
              "09": {
                label: "Organic Peroxide"
              },
              10: {
                label: "Oxidizer"
              },
              11: {
                label: "Radioactive Material"
              },
              12: {
                label: "Spontaneously Combustible Material"
              },
              13: {
                label: "Toxic Gas"
              },
              14: {
                label: "Toxic Infectious Material"
              },
              15: {
                label: "Unexploded Ordnance"
              }
            }
          }
        }
      },
      16: {
        label: "Transportation Incident",
        options: {
          "01": {
            label: "Air"
          },
          "02": {
            label: "Marine"
          },
          "03": {
            label: "Rail"
          },
          "04": {
            label: "Vehicle"
          },
          "05": {
            label: "Wheeled Vehicle Explosion"
          }
        }
      },
      17: {
        label: "Natural Event",
        options: {
          "01": {
            label: "Geologic",
            options: {
              "01": {
                label: "Aftershock"
              },
              "02": {
                label: "Avalanche"
              },
              "03": {
                label: "Earthquake Epicentre"
              },
              "04": {
                label: "Landslide"
              },
              "05": {
                label: "Subsidence"
              },
              "06": {
                label: "Volcanic Eruption"
              },
              "07": {
                label: "Volcanic Threat"
              },
              "08": {
                label: "Cave Entrance"
              }
            }
          },
          "02": {
            label: "Hydro-Meteorological",
            options: {
              "01": {
                label: "Drought"
              },
              "02": {
                label: "Flood"
              },
              "03": {
                label: "Tsunami"
              }
            }
          },
          "03": {
            label: "Infestation",
            options: {
              "01": {
                label: "Bird"
              },
              "02": {
                label: "Insect"
              },
              "03": {
                label: "Microbial"
              },
              "04": {
                label: "Reptile"
              },
              "05": {
                label: "Rodent"
              }
            }
          }
        }
      },
      18: {
        label: "Individual",
        options: {
          "01": {
            label: "Religious Leader"
          },
          "02": {
            label: "Speaker"
          }
        }
      }
    },
    45: {
      11: {
        label: "Pressure Systems",
        options: {
          "01": {
            label: "Low Pressure Centre",
            options: {
              "01": {
                label: "Cyclone Centre"
              },
              "02": {
                label: "Tropopause Low"
              }
            }
          },
          "02": {
            label: "High Pressure Centre",
            options: {
              "01": {
                label: "Anticyclone Centre"
              },
              "02": {
                label: "Tropopause High"
              }
            }
          },
          "03": {
            label: "Frontal Systems",
            options: {
              "01": {
                label: "Cold Front"
              },
              "02": {
                label: "Upper Cold Front"
              },
              "03": {
                label: "Cold Frontogenesis"
              },
              "04": {
                label: "Cold Frontolysis"
              },
              "05": {
                label: "Warm Front"
              },
              "06": {
                label: "Upper Warm Front"
              },
              "07": {
                label: "Warm Frontogenesis"
              },
              "08": {
                label: "Warm Frontolysis"
              },
              "09": {
                label: "Occluded Front"
              },
              10: {
                label: "Upper Occluded Front"
              },
              11: {
                label: "Occluded Frontolysis"
              },
              12: {
                label: "Stationary Front"
              },
              13: {
                label: "Upper Stationary Front"
              },
              14: {
                label: "Stationary Frontogenesis"
              },
              15: {
                label: "Stationary Frontolysis"
              }
            }
          },
          "04": {
            label: "Lines",
            options: {
              "01": {
                label: "Trough Axis"
              },
              "02": {
                label: "Upper Trough Axis"
              },
              "03": {
                label: "Ridge Axis"
              },
              "04": {
                label: "Severe Squall Line"
              },
              "05": {
                label: "Instability Line"
              },
              "06": {
                label: "Shear Line"
              },
              "07": {
                label: "Inter-Tropical Convergence Zone"
              },
              "08": {
                label: "Convergence Line"
              },
              "09": {
                label: "Inter-Tropical Discontinuity"
              }
            }
          },
          "05": {
            label: "Pressure Tendency",
            options: {
              "01": {
                label: "Rise Then Fall Higher"
              },
              "02": {
                label: "Rise Then Steady"
              },
              "03": {
                label: "Rise"
              },
              "04": {
                label: "Rise Then Rise Higher"
              },
              "05": {
                label: "Steady"
              },
              "06": {
                label: "Fall Then Rise Lower"
              },
              "07": {
                label: "Fall Then Steady"
              },
              "08": {
                label: "Fall"
              },
              "09": {
                label: "Rise Then Fall Lower"
              }
            }
          }
        }
      },
      12: {
        label: "Turbulence",
        options: {
          "01": {
            label: "Light"
          },
          "02": {
            label: "Moderate"
          },
          "03": {
            label: "Severe"
          },
          "04": {
            label: "Extreme"
          },
          "05": {
            label: "Mountain Waves"
          }
        }
      },
      13: {
        label: "Icing",
        options: {
          "01": {
            label: "Clear Icing",
            options: {
              "01": {
                label: "Light"
              },
              "02": {
                label: "Moderate"
              },
              "03": {
                label: "Severe"
              }
            }
          },
          "02": {
            label: "Rime Icing",
            options: {
              "01": {
                label: "Light"
              },
              "02": {
                label: "Moderate"
              },
              "03": {
                label: "Severe"
              }
            }
          },
          "03": {
            label: "Mixed Icing",
            options: {
              "01": {
                label: "Light"
              },
              "02": {
                label: "Moderate"
              },
              "03": {
                label: "Severe"
              }
            }
          }
        }
      },
      14: {
        label: "Winds",
        options: {
          "01": {
            label: "Calm Winds"
          },
          "02": {
            label: "Wind Plot"
          },
          "03": {
            label: "Jet Stream"
          },
          "04": {
            label: "Stream Line"
          }
        }
      },
      15: {
        label: "Cloud Cover",
        options: {
          "01": {
            label: "Cloud Coverage Symbols",
            options: {
              "01": {
                label: "Clear Sky"
              },
              "02": {
                label: "Few Coverage"
              },
              "03": {
                label: "Scattered Coverage"
              },
              "04": {
                label: "Broken Coverage"
              },
              "05": {
                label: "Overcast Coverage"
              },
              "06": {
                label: "Sky Totally or Partially Obscured"
              }
            }
          }
        }
      },
      16: {
        label: "Atmospheric Symbols",
        options: {
          "01": {
            label: "Rain",
            options: {
              "01": {
                label: "Intermittent Light"
              },
              "02": {
                label: "Continuous Light"
              },
              "03": {
                label: "Intermittent Moderate"
              },
              "04": {
                label: "Intermittent Moderate/Continuous Moderate"
              },
              "05": {
                label: "Intermittent Heavy"
              },
              "06": {
                label: "Intermittent Heavy/Continuous Heavy"
              }
            }
          },
          "02": {
            label: "Freezing Rain",
            options: {
              "01": {
                label: "Light"
              },
              "02": {
                label: "Moderate/Heavy"
              }
            }
          },
          "03": {
            label: "Rain Showers",
            options: {
              "01": {
                label: "Light"
              },
              "02": {
                label: "Moderate/Heavy"
              },
              "03": {
                label: "Torrential"
              }
            }
          },
          "04": {
            label: "Drizzle",
            options: {
              "01": {
                label: "Intermittent Light"
              },
              "02": {
                label: "Intermittent Light/Continuous Light"
              },
              "03": {
                label: "Intermittent Moderate"
              },
              "04": {
                label: "Intermittent Moderate/Continuous Moderate"
              },
              "05": {
                label: "Intermittent Heavy"
              },
              "06": {
                label: "Intermittent Heavy/Continuous Heavy"
              }
            }
          },
          "05": {
            label: "Freezing Drizzle",
            options: {
              "01": {
                label: "Light"
              },
              "02": {
                label: "Moderate/Heavy"
              }
            }
          },
          "06": {
            label: "Rain and Snow Mixed",
            options: {
              "01": {
                label: "Rain or Drizzle and Snow - Light"
              },
              "02": {
                label: "Rain or Drizzle and Snow - Moderate/Heavy"
              },
              "03": {
                label: "Rain and Snow Showers - Light"
              },
              "04": {
                label: "Rain and Snow Showers - Moderate/Heavy"
              }
            }
          },
          "07": {
            label: "Snow",
            options: {
              "01": {
                label: "Intermittent Light"
              },
              "02": {
                label: "Intermittent Light/Continuous Light"
              },
              "03": {
                label: "Intermittent Moderate"
              },
              "04": {
                label: "Intermittent Moderate/Continuous Moderate"
              },
              "05": {
                label: "Intermittent Heavy"
              },
              "06": {
                label: "Intermittent Heavy/Continuous Heavy"
              },
              "07": {
                label: "Blowing Snow - Light/Moderate"
              },
              "08": {
                label: "Blowing Snow - Heavy"
              }
            }
          },
          "08": {
            label: "Snow Grains"
          },
          "09": {
            label: "Snow Showers",
            options: {
              "01": {
                label: "Light"
              },
              "02": {
                label: "Moderate/Heavy"
              }
            }
          },
          10: {
            label: "Hail",
            options: {
              "01": {
                label: "Light not Associated with Thunder"
              },
              "02": {
                label: "Moderate/Heavy not Associated with Thunder"
              }
            }
          },
          11: {
            label: "Ice Crystals (Diamond Dust)"
          },
          12: {
            label: "Ice Pellets (Sleet)",
            options: {
              "01": {
                label: "Light"
              },
              "02": {
                label: "Moderate"
              },
              "03": {
                label: "Heavy"
              }
            }
          },
          13: {
            label: "Inversion"
          },
          14: {
            label: "Storms",
            options: {
              "01": {
                label: "Thunderstorm - No Precipitation"
              },
              "02": {
                label: "Thunderstorm Light to Moderate with Rain/Snow - No Hail"
              },
              "03": {
                label: "Thunderstorm Heavy with Rain/Snow - No Hail"
              },
              "04": {
                label: "Thunderstorm Light to Moderate - With Hail"
              },
              "05": {
                label: "Thunderstorm Heavy - With Hail"
              },
              "06": {
                label: "Funnel Cloud (Tornado/Waterspout)"
              },
              "07": {
                label: "Squall"
              },
              "08": {
                label: "Lightning"
              }
            }
          },
          15: {
            label: "Fog",
            options: {
              "01": {
                label: "Shallow Patches"
              },
              "02": {
                label: "Shallow Continuous"
              },
              "03": {
                label: "Patchy"
              },
              "04": {
                label: "Sky Visible"
              },
              "05": {
                label: "Sky Obscured"
              },
              "06": {
                label: "Freezing, Sky Visible"
              },
              "07": {
                label: "Freezing, Sky Obscured"
              }
            }
          },
          16: {
            label: "Mist"
          },
          17: {
            label: "Smoke"
          },
          18: {
            label: "Haze"
          },
          19: {
            label: "Dust or Sand",
            options: {
              "01": {
                label: "Light to Moderate"
              },
              "02": {
                label: "Severe"
              },
              "03": {
                label: "Dust Devil"
              },
              "04": {
                label: "Blowing Dust or Sand"
              }
            }
          },
          20: {
            label: "Tropical Storm Systems",
            options: {
              "01": {
                label: "Tropical Depression"
              },
              "02": {
                label: "Tropical Storm"
              },
              "03": {
                label: "Hurricane/Typhoon"
              },
              "04": {
                label: "Tropical Storm Wind Areas and Date/Time Labels"
              }
            }
          },
          21: {
            label: "Volcanic Eruption",
            options: {
              "01": {
                label: "Volcanic Ash"
              }
            }
          },
          22: {
            label: "Tropopause Level"
          },
          23: {
            label: "Freezing Level"
          },
          24: {
            label: "Precipitation of Unknown Type and Intensity"
          }
        }
      },
      17: {
        label: "Bounded Areas of Weather",
        options: {
          "01": {
            label: "Instrument Flight Rule (IFR)"
          },
          "02": {
            label: "Marginal Visual Flight Rule (MVFR)"
          },
          "03": {
            label: "Turbulence"
          },
          "04": {
            label: "Icing"
          },
          "05": {
            label:
              "Liquid Precipitation - Non-Convective Continuous or Intermittent",
            options: {
              "01": {
                label: "Liquid Precipitation - Convective"
              }
            }
          },
          "06": {
            label: "Freezing/Frozen Precipitation"
          },
          "07": {
            label: "Thunderstorm"
          },
          "08": {
            label: "Fog"
          },
          "09": {
            label: "Dust or Sand"
          },
          10: {
            label: "Operator-Defined Freeform"
          }
        }
      },
      18: {
        label: "Isopleths",
        options: {
          "01": {
            label: "Isobar - Surface"
          },
          "02": {
            label: "Contour - Upper Air"
          },
          "03": {
            label: "Isotherm"
          },
          "04": {
            label: "Isotach"
          },
          "05": {
            label: "Isodrosotherm"
          },
          "06": {
            label: "Thickness"
          },
          "07": {
            label: "Operator-Defined Freeform"
          }
        }
      },
      19: {
        label: "State of the Ground",
        options: {
          "01": {
            label: "Without Snow or Measurable Ice Cover",
            options: {
              "01": {
                label:
                  "Surface Dry Without Cracks or Appreciable Dust or Loose Sand"
              },
              "02": {
                label: "Surface Moist"
              },
              "03": {
                label: "Surface Wet, Standing Water in Small or Large Pools"
              },
              "04": {
                label: "Surface Flooded"
              },
              "05": {
                label: "Surface Frozen"
              },
              "06": {
                label: "Glaze (Thin Ice) on Ground"
              },
              "07": {
                label: "Loose Dry Dust or Sand not Covering Ground Completely"
              },
              "08": {
                label: "Thin Loose Dry Dust or Sand Covering Ground Completely"
              },
              "09": {
                label:
                  "Moderate/Thick Loose Dry Dust or Sand Covering Ground Completely"
              },
              10: {
                label: "Extremely Dry with Cracks"
              }
            }
          },
          "02": {
            label: "With Snow or Measurable Ice Cover",
            options: {
              "01": {
                label: "Predominately Ice Covered"
              },
              "02": {
                label:
                  "Compact or Wet Snow (with or without Ice) Covering Less Than One-Half of Ground"
              },
              "03": {
                label:
                  "Compact or Wet Snow (with or without Ice) Covering at Least One-Half of Ground, but Ground not Completely Covered"
              },
              "04": {
                label:
                  "Even Layer of Compact or Wet Snow Covering Ground Completely"
              },
              "05": {
                label:
                  "Uneven Layer of Compact or Wet Snow Covering Ground Completely"
              },
              "06": {
                label: "Loose Dry Snow Covering Less Than One-Half of Ground"
              },
              "07": {
                label:
                  "Loose Dry Snow Covering at Least One-Half of Ground, but Ground not Completely Covered"
              },
              "08": {
                label: "Even Layer of Loose Dry Snow Covering Ground Completely"
              },
              "09": {
                label:
                  "Uneven Layer of Loose Dry Snow Covering Ground Completely"
              },
              10: {
                label: "Snow Covering Ground Completely, Deep Drifts"
              }
            }
          }
        }
      }
    }
  },
  app6sectorOneModifier: {
    "01": {
      "00": "Not Applicable",
      "01": "Attack/Strike",
      "02": "Bomber",
      "03": "Cargo",
      "04": "Fighter",
      "05": "Interceptor",
      "06": "Tanker",
      "07": "Utility",
      "08": "Vertical or Short Take-off and Landing (VSTOL)/Vertical Take-off and Landing (VTOL)",
      "09": "Passenger",
      10: "Ultra Light",
      11: "Airborne Command Post (ACP)",
      12: "Airborne Early Warning (AEW)",
      13: "Government",
      14: "Medical Evacuation (MEDEVAC)",
      15: "Escort",
      16: "Electronic Combat (EC)/Jammer",
      17: "Patrol",
      18: "Reconnaissance",
      19: "Trainer",
      20: "Photographic Reconnaissance",
      21: "Personnel Recovery",
      22: "Antisubmarine Warfare",
      23: "Communications",
      24: "Electronic Support Measures (ESM)",
      25: "Mine Countermeasures (MCM)",
      26: "Search and Rescue",
      27: "Special Operations Forces",
      28: "Surface Warfare",
      29: "Very Important Person (VIP) Transport",
      30: "Combat Search and Rescue (CSAR)",
      31: "Suppression of Enemy Air Defences",
      32: "Antisurface Warfare",
      33: "Fighter/Bomber",
      34: "Intensive Care",
      35: "Electronic Attack (EA)",
      36: "Multimission",
      37: "Hijacking",
      38: "ASW Helo- LAMPS",
      39: "ASW Helo - SH-60R"
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
      "02": "Medium Earth Orbit (MEO)",
      "03": "High Earth Orbit (HEO)",
      "04": "Geosynchronous Orbit (GSO)",
      "05": "Geostationary Orbit (GO)",
      "06": "Molniya Orbit (MO)"
    },
    10: {
      "00": "Unspecified",
      "01": "Air Mobile/Air Assault",
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
      25: "Fire Direction Centre",
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
      47: "Node Centre",
      48: "Nuclear",
      49: "Operations",
      50: "Radar",
      51: "Radio Frequency Identification (RFID) Interrogator / Sensor",
      52: "Radiological",
      53: "Search and Rescue",
      54: "Security",
      55: "Sensor",
      56: "Sensor Control Module (SCM)",
      57: "Signals Intelligence",
      58: "Single Shelter Switch",
      59: "Single Rocket Launcher",
      60: "Smoke",
      61: "Sniper",
      62: "Sound Ranging",
      63: "Special Operations Forces (SOF)",
      64: "Special Weapons and Tactics",
      65: "Survey",
      66: "Tactical Exploitation",
      67: "Target Acquisition",
      68: "Topographic",
      69: "Utility",
      70: "Video Imagery (Combat Camera)",
      75: "Medevac",
      76: "Ranger",
      77: "Support",
      78: "Aviation",
      79: "Route, Reconnaissance, and Clearance",
      80: "Command Post Node",
      81: "Joint Network Node",
      82: "Retransmission Site",
      94: "Theatre",
      95: "Army or Theatre Army",
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
      15: "Coerced/Impressed Recruit",
      16: "Willing Recruit",
      17: "Religious or Religious Organization",
      18: "Targeted Individual or Organization",
      19: "Terrorist or Terrorist Organization",
      20: "Speaker",
      21: "Accident",
      22: "Combat",
      23: "Other",
      24: "Loot"
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
      "09": "Civilian"
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
      14: "Retransmission Site",
      15: "Joint Network Node",
      16: "Command Post Node"
    },
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
      47: "Team/Crew",
      48: "Squad",
      49: "Section",
      50: "Platoon/Detachment",
      51: "Company",
      52: "Battalion",
      53: "Regiment/Group",
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
      19: "Helicopter-Equipped/VSTOL",
      20: "Ballistic Missile Defence, Shooter",
      21: "Ballistic Missile Defence, Long-Range Surveillance and Track (LRS&T)",
      22: "Sea-Base X-Band",
      23: "Hijacking"
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
      20: "Hijacking/Hijacked"
    },
    40: {
      "00": "Unspecified",
      "01": "Assassination",
      "02": "Execution (Wrongful Killing)",
      "03": "Hijacking/Hijacked",
      "04": "House-to-House",
      "05": "Kidnapping",
      "06": "Murder",
      "07": "Piracy",
      "08": "Rape",
      "09": "Written Psychological Operations (PSYOPS)",
      10: "Pirate",
      11: "False",
      12: "Find",
      13: "Found and Cleared",
      14: "Hoax (Decoy)",
      15: "Attempted",
      16: "Accident",
      17: "Incident",
      18: "Theft"
    }
  },
  app6sectorTwoModifier: {
    "01": {
      "00": "Not Applicable",
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
      11: "Downlinked"
    },
    "02": {
      "00": "Unspecified",
      "01": "Air",
      "02": "Surface",
      "03": "Subsurface",
      "04": "Space",
      "05": "Launched",
      "07": "Patriot",
      "08": "Standard Missile-2 (SM-2)",
      "09": "Standard Missile-6 (SM-6)",
      10: "Evolved Sea Sparrow Missile (ESSM)",
      11: "Rolling Airframe Missile (RAM)",
      12: "Short Range",
      13: "Medium Range",
      14: "Intermediate Range",
      15: "Long Range",
      16: "Intercontinental"
    },
    "05": {
      "00": "Unspecified",
      "01": "Optical",
      "02": "Infrared",
      "03": "Radar",
      "04": "Signals Intelligence (SIGINT)"
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
      39: "Rescue Coordination Centre",
      40: "Riverine",
      41: "Single Channel",
      42: "Ski",
      43: "Short Range",
      44: "Strategic",
      45: "Support",
      46: "Tactical",
      47: "Towed",
      48: "Troop",
      49: "Vertical or Short Take-Off and Landing (VTOL/VSTOL)",
      50: "Veterinary",
      51: "Wheeled",
      52: "High to Low Altitude",
      53: "Medium to Low Altitude",
      54: "Attack",
      55: "Refuel",
      56: "Utility",
      57: "Combat Search and Rescue"
    },
    11: {
      "00": "Unspecified",
      "01": "Leader or Leadership"
    },
    20: {
      "00": "Unspecified",
      "01": "Biological",
      "02": "Chemical",
      "03": "Nuclear",
      "04": "Radiological",
      "05": "Atomic Energy Reactor",
      "06": "Nuclear Material Production",
      "07": "Nuclear Material Storage",
      "08": "Weapons Grade"
    },
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
      39: "Ski"
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
      15: "Expendable"
    },
    35: {
      "00": "Unspecified",
      "01": "Air Independent Propulsion",
      "02": "Diesel Electric, General",
      "03": "Diesel - Type 1",
      "04": "Diesel - Type 2",
      "05": "Diesel - Type 3",
      "06": "Nuclear Powered, General",
      "07": "Nuclear - Type 1",
      "08": "Nuclear - Type 2",
      "09": "Nuclear - Type 3",
      10: "Nuclear - Type 4",
      11: "Nuclear - Type 5",
      12: "Nuclear - Type 6",
      13: "Nuclear - Type 7",
      14: "Autonomous Control",
      15: "Remotely Piloted",
      16: "Expendable"
    }
  }
}
