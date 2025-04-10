export const App6Choices: { [key: string]: any } = {
  app6context: {
    0: "Reality",
    1: "Exercise",
    2: "Simulation"
  },
  app6standardIdentity: {
    0: "Pending",
    1: "Unknown",
    2: "Assumed friend",
    3: "Friend",
    4: "Neutral",
    6: "Hostile"
  },
  app6symbolSet: {
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
  },
  app6status: {
    0: "Present",
    1: "Planned / Anticipated / Suspect",
    2: "Present / Fully capable",
    3: "Present / Damaged",
    4: "Present / Destroyed",
    5: "Present / Full to capacity"
  },
  app6hq: {
    1: "Feint / Dummy",
    2: "Headquarters",
    3: "Feint / Dummy Headquarters",
    4: "Task Force",
    5: "Feint / Dummy Task Force",
    6: "Task Force Headquarters",
    7: "Feint / Dummy Task Force Headquarters"
  },
  app6amplifier: {
    10: {
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
      71: "Leader"
    },
    30: {
      61: "Short towed array",
      62: "Long towed array"
    },
    35: {
      61: "Short towed array",
      62: "Long towed array"
    }
  },
  app6entity: {
    "01": {
      11: {
        label: "Military",
        options: {
          "01": {
            label: "Fixed Wing",
            options: {
              "01": {
                label: "Medical Evacuation (MEDEVAC)"
              },
              "02": {
                label: "Attack / Strike"
              },
              "03": {
                label: "Bomber"
              },
              "04": {
                label: "Fighter"
              },
              "05": {
                label: "Fighter / Bomber"
              },
              // "06": {
              //   label: "Reserved for Future Use"
              // },
              "07": {
                label: "Cargo"
              },
              "08": {
                label: "Electronic Combat (EC) / Jammer"
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
                label: "Electronic Support Measures(ESM)"
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
                label: "Ultra Light"
              },
              28: {
                label: "Photographic Reconnaissance"
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
            label:
              "Unmanned Aircraft (UA) / Unmanned Aerial Vehicle (UAV) / Unmanned Aircraft System (UAS) / Remotely Piloted Vehicle (RPV)"
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
        label: "Civilian",
        options: {
          "01": {
            label: "Fixed Wing"
          },
          "02": {
            label: "Rotary Wing"
          },
          "03": {
            label:
              "Unmanned Aircraft (UA) / Unmanned Aerial Vehicle (UAV) / Unmanned Aircraft System (UAS) / Remotely Piloted Vehicle (RPV)"
          },
          "04": {
            label: "Lighter Than Air"
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
        label: "Weapon",
        options: {
          "01": {
            label: "Bomb"
          },
          "02": {
            label: "Decoy"
          }
        }
      },
      14: {
        label: "Manual Track"
      }
    },
    "02": {
      11: {
        label: "Missile"
      }
    },
    "05": {
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
        label: "Civilian",
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
    "06": {
      11: {
        label: "Missile"
      }
    },
    10: {
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
            label: "Air Traffic Services / Airfield Operations"
          },
          "03": {
            label: "Amphibious"
          },
          "04": {
            label: "Antitank / Antiarmour",
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
            label: "Armour / Armoured / Mechanized / Self-Propelled /  Tracked",
            options: {
              "01": {
                label: "Reconnaissance / Cavalry / Scout"
              },
              "02": {
                label: "Amphibious"
              }
            }
          },
          "06": {
            label: "Army Aviation / Aviation Rotary Wing",
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
                label: "Armoured / Mechanized / Tracked"
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
                label: "Main Gun System / Heavy Weapon"
              }
            }
          },
          12: {
            label: "Observer"
          },
          13: {
            label: "Reconnaissance / Cavalry / Scout",
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
            label: "Air / Land Naval Gunfire Liaison"
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
                label: "Armoured / Mechanized /  Tracked"
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
            label: "Fire Fighting / Fire Protection"
          },
          11: {
            label: "Geospatial Support / Geospatial Information Support"
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
            label: "Airport of Debarkation / Airport of Embarkation"
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
            label: "Laundry / Bath"
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
            label: "Mortuary Affairs / Graves Registration"
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
            label: "Public Affairs / Public Information"
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
          32: {
            label: "Replacement Holding Unit"
          },
          33: {
            label: "Seaport of Debarkation / Seaport of Embarkation"
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
      11: {
        label: "Weapons / Weapons System",
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
                label: "Light, Light Transporter-Launcher and Radar (TLAR)"
              },
              "03": {
                label: "Light, Light Tactical Landing Approach Radar (TELAR)"
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
                label: "Multifunctional Earthmover / Digger"
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
                label: "Dozer , Armoured"
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
                label: "Small / Light"
              },
              "02": {
                label: "Medium"
              },
              "03": {
                label: "Large / Heavy"
              }
            }
          },
          "06": {
            label: "Tractor Trailer Truck with Box",
            options: {
              "01": {
                label: "Small / Light"
              },
              "02": {
                label: "Medium"
              },
              "03": {
                label: "Large / Heavy"
              }
            }
          },
          "07": {
            label: "Tractor Trailer Truck with Flatbed Trailer",
            options: {
              "01": {
                label: "Small / Light"
              },
              "02": {
                label: "Medium"
              },
              "03": {
                label: "Large / Heavy"
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
            label: "Crane / Loading Device"
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
            label: "Fire Fighting / Fire Protection"
          }
        }
      },
      24: {
        label: "Manual Track"
      },
      25: {
        label: "Rotary Wing"
      }
    },
    20: {
      11: {
        label: "Installation",
        options: {
          "01": {
            label: "Aircraft Production / Assembly"
          },
          "02": {
            label: "Ammunition and Explosives / Production"
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
                label: "Displaced Persons /  Refugee / Evacuees Camp"
              },
              "02": {
                label: "Training Camp"
              }
            }
          },
          20: {
            label: "Warehouse / Storage Facility"
          },
          21: {
            label: "Law  Enforcement",
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
                label: "Farm / Ranch"
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
            label: "Banking Finance and Insurance  Infrastructure",
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
                label: "College / University"
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
                label: "Petroleum / Gas / Oil"
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
                label: "Airport / Air Base"
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
                label: "Railhead / Railroad Station"
              },
              "08": {
                label: "Rest Stop"
              },
              "09": {
                label: "Sea Port / Naval Base"
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
    27: {
      11: {
        label: "Military",
        options: {
          "01": {
            label: "Service / Branch",
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
            label: "Activity / Task",
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
            label: "Activity / Task",
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
                label: "Amphibious Assault, Nonspecified"
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
                label: "Patrol Craft, Submarine Chaser / Escort, General"
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
            label: "Spdboat",
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
            label: "Service Craft / Yard",
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
                label: "Merchant Ship, Roll-On, Roll-Off (RO / RO)"
              },
              "05": {
                label: "Merchant Ship, Car / Passenger Ferry"
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
                label: "MERCHANT SHIP, TUG, OCEAN GOING"
              },
              12: {
                label: "Tow"
              },
              13: {
                label: "Transport Ship, Hazardous Material"
              },
              14: {
                label: "Junk / Dhow - Dhow"
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
                label: "Spdboat"
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
              "Autonomous Underwater Vehicle (AUV) / Unmanned Underwater Vehicle (UUV)"
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
            label: "Submersible, General (Commercial) Submersible"
          },
          "02": {
            label:
              "Autonomous Underwater Vehicle (AUV) /  Unmanned Underwater Vehicle (UUV)"
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
                label: "MILCO - General, Confidence  Level 1"
              },
              "02": {
                label: "MILCO - General, Confidence  Level 2"
              },
              "03": {
                label: "MILCO - General, Confidence  Level 3"
              },
              "04": {
                label: "MILCO - General, Confidence  Level 4"
              },
              "05": {
                label: "MILCO - General, Confidence  Level 5"
              }
            }
          },
          "02": {
            label: "MILCO - Bottom",
            options: {
              "01": {
                label: "MILCO - Bottom, Confidence  Level 1"
              },
              "02": {
                label: "MILCO - Bottom, Confidence  Level 2"
              },
              "03": {
                label: "MILCO - Bottom, Confidence  Level 3"
              },
              "04": {
                label: "MILCO - Bottom, Confidence  Level 4"
              },
              "05": {
                label: "MILCO - Bottom, Confidence  Level 5"
              }
            }
          },
          "03": {
            label: "MILCO - Moored",
            options: {
              "01": {
                label: "MILCO - Moored, Confidence  Level 1"
              },
              "02": {
                label: "MILCO - Moored, Confidence  Level 2"
              },
              "03": {
                label: "MILCO - Moored, Confidence  Level 3"
              },
              "04": {
                label: "MILCO - Moored, Confidence  Level 4"
              },
              "05": {
                label: "MILCO - Moored, Confidence  Level 5"
              }
            }
          },
          "04": {
            label: "MILCO - Floating",
            options: {
              "01": {
                label: "MILCO - Floating, Confidence  Level 1"
              },
              "02": {
                label: "MILCO - Floating, Confidence  Level 2"
              },
              "03": {
                label: "MILCO - Floating, Confidence  Level 3"
              },
              "04": {
                label: "MILCO - Floating, Confidence  Level 4"
              },
              "05": {
                label: "MILCO - Floating, Confidence  Level 5"
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
                label: "Vandalism / Loot / Ransack / Plunder"
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
            label: "Bomb / Bombing",
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
            label: "PSYCHOLOGICAL OPERATIONS (PSYOPS)",
            options: {
              "01": {
                label: "TV and Radio Propaganda"
              }
            }
          },
          "03": {
            label: "Foraging / Searching"
          },
          "04": {
            label: "Recruitment",
            options: {
              "01": {
                label: "Willing"
              },
              "02": {
                label: "Coerced / Impressed"
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
                label: "Polling Place / Election"
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
    50: {
      11: {
        label: "Signal Intercept",
        options: {
          "01": {
            label: "Communications"
          },
          "02": {
            label: "Jammer"
          },
          "03": {
            label: "Radar"
          }
        }
      }
    },
    51: {
      11: {
        label: "Signal Intercept",
        options: {
          "01": {
            label: "Communications"
          },
          "02": {
            label: "Jammer"
          },
          "03": {
            label: "Radar"
          }
        }
      }
    },
    52: {
      11: {
        label: "Signal Intercept",
        options: {
          "01": {
            label: "Communications"
          },
          "02": {
            label: "Jammer"
          },
          "03": {
            label: "Radar"
          }
        }
      }
    },
    53: {
      11: {
        label: "Signal Intercept",
        options: {
          "01": {
            label: "Communications"
          },
          "02": {
            label: "Jammer"
          },
          "03": {
            label: "Radar"
          }
        }
      }
    },
    54: {
      11: {
        label: "Signal Intercept",
        options: {
          "01": {
            label: "Communications"
          },
          "02": {
            label: "Jammer"
          },
          "03": {
            label: "Radar"
          }
        }
      }
    },
    60: {
      11: {
        label: "Mission Force",
        options: {
          "01": {
            label: "Combat Mission Team"
          },
          "02": {
            label: "National Mission Team"
          },
          "03": {
            label: "Cyber Protection Team"
          },
          "04": {
            label: "Nation State Cyber Threat Actor"
          },
          "05": {
            label: "Non Nation State Cyber Threat Actor"
          }
        }
      }
    }
  },
  app6sectorOneModifier: {
    "01": {
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
      "01": "Ballistic",
      "02": "Space",
      "03": "Interceptor"
    },
    10: {
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
      51: "Radio Frequency Identification (RFID) Interrogator  /  Sensor",
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
      68: "Topographic / Geospatial",
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
      // 25: "Reserved for Future Use",
      26: "Version Extension Flag"
    },
    15: {
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
    27: {
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
      // 24: "Reserved for Future Use",
      25: "Version Extension Flag"
    },
    35: {
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
    36: {
      // "00": "Not Applicable"
    },
    40: {
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
      65: "Cyberspace"
      // 66: "Reserved for Future Use"
    },
    50: {
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
      65: "Cyberspace"
      // 66: "Reserved for Future Use"
    },
    51: {
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
      65: "Cyberspace"
      // 66: "Reserved for Future Use"
    },
    52: {
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
      65: "Cyberspace"
      // 66: "Reserved for Future Use"
    },
    53: {
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
      65: "Cyberspace"
      // 66: "Reserved for Future Use"
    },
    54: {
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
      65: "Cyberspace"
      // 66: "Reserved for Future Use"
    }
    // 60: {
    //   "00": "Not Applicable"
    // }
  },
  app6sectorTwoModifier: {
    "01": {
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
      // 15: "Reserved for Future Use",
      16: "Intercontinental"
    },
    "05": {
      "01": "Optical",
      "02": "Infrared",
      "03": "Radar",
      "04": "Signals Intelligence (SIGINT)",
      "05": "Cyberspace",
      99: "Version Extension Flag"
    },
    "06": {
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
      49: "Vertical or Short Take-Off and Landing (VTOL / VSTOL)",
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
      69: "Service Craft / Yard",
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
      "01": "Leader or Leadership",
      "02": "Cyberspace"
    },
    15: {
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
    27: {
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
    // 36: {
    //   "00": "Not Applicable"
    // },
    40: {
      "01": "Cyberspace"
    },
    50: {
      "01": "Cyberspace"
    },
    51: {
      "01": "Cyberspace"
    },
    52: {
      "01": "Cyberspace"
    },
    53: {
      "01": "Cyberspace"
    },
    54: {
      "01": "Cyberspace"
    }
    // 60: {
    //   "00": "Not Applicable"
    // }
  }
}
