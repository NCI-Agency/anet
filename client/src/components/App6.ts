// This mapping was derived from https://www.arcgis.com/home/item.html?id=ea516cad079444478910e5da0c7107c1
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
    10: "Land Units",
    11: "Land Civilian",
    15: "Land Equipment",
    20: "Land Installation",
    27: "Dismounted Individual",
    30: "Sea Surface",
    35: "Sea Subsurface",
    36: "Mine Warfare",
    40: "Activities",
    50: "Signals Intelligence - Space",
    51: "Signals Intelligence - Air",
    52: "Signals Intelligence - Land",
    53: "Signals Intelligence - Surface",
    54: "Signals Intelligence - Subsurface",
    60: "Cyberspace",
    98: "Internal"
  },
  app6status: {
    0: "Present",
    1: "Planned"
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
      11: "Team/Crew",
      12: "Squad",
      13: "Section",
      14: "Platoon/Detachment",
      15: "Company/Battery/Troop",
      16: "Battalion/Squadron",
      17: "Regiment/Group",
      18: "Brigade",
      21: "Division",
      22: "Corps/MEF",
      23: "Army",
      24: "Army Group/Front",
      25: "Region/Theater",
      26: "Command"
    },
    15: {
      31: "Wheeled limited cross country",
      32: "Wheeled cross country",
      33: "Tracked",
      34: "Wheeled and tracked combination",
      35: "Towed",
      36: "Rail",
      37: "Pack animals",
      41: "Over snow (prime mover)",
      42: "Sled",
      51: "Barge",
      52: "Amphibious"
    },
    27: {
      71: "Leadership"
    }
  },
  app6entity: {
    "01": {
      11: {
        label: "Military (Air)",
        options: {
          "01": {
            label: "Fixed-Wing",
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
                label: "VSTOL"
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
                label: "Electronic Support Measures (ESM)"
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
                label: "Suppression of Enemy Air Defense"
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
            label: "Rotary-Wing"
          },
          "03": {
            label: "Unmanned Aircraft (UA- UAV- UAS- RPV)"
          },
          "04": {
            label: "Vertical-Takeoff UAV (VT-UAV)"
          },
          "05": {
            label: "Lighter Than Air"
          },
          "06": {
            label: "Airship"
          },
          "07": {
            label: "Tethered Lighter Than Air"
          }
        }
      },
      12: {
        label: "Civilian (Air)",
        options: {
          "01": {
            label: "Fixed Wing"
          },
          "02": {
            label: "Rotary Wing"
          },
          "03": {
            label: "Unmanned Aircraft (UA- UAV- UAS- RPV)"
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
        label: "Weapon (Air)",
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
        label: "Manual Track (Air)"
      }
    },
    "02": {
      11: {
        label: "Missile (Air Missile)"
      }
    },
    "05": {
      11: {
        label: "Military (Space)",
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
            label: "Satellite- General"
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
        label: "Civilian (Space)",
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
        label: "Manual Track (Space)"
      }
    },
    "06": {
      11: {
        label: "Missile (Space Missile)"
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
            label: "Liaison"
          },
          "06": {
            label: "Military Information Support (MISO)",
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
            label: "Radio Teletype Center"
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
        label: "Movement and Maneuver",
        options: {
          "02": {
            label: "Air Traffic Services/Airfield Operations"
          },
          "05": {
            label: "Armor/Armored/Mechanized/Self-Propelled/Tracked"
          },
          "06": {
            label: "Army Aviation/Aviation Rotary Wing"
          },
          "07": {
            label: "Aviation Composite"
          },
          "08": {
            label: "Aviation Fixed Wing"
          },
          "09": {
            label: "Combat"
          },
          10: {
            label: "Combined Arms"
          },
          12: {
            label: "Observer"
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
            label: "SOF",
            options: {
              "01": {
                label: "Fixed Wing MISO"
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
          "03": {
            label: "Field Artillery",
            options: {
              "01": {
                label: "Self-propelled"
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
                label: "Armored/Mechanized/Tracked"
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
            label: "CBRN Defense",
            options: {
              "01": {
                label: "Mechanized"
              }
            }
          },
          "02": {
            label: "Combat Support (Maneuver Enhancement)"
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
          "09": {
            label: "Joint Intelligence Center"
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
          "03": {
            label: "Airport of Debarkation/Airport of Embarkation"
          },
          "04": {
            label: "Ammunition"
          },
          "05": {
            label: "Band"
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
            label: "Labor"
          },
          10: {
            label: "Laundry/Bath"
          },
          11: {
            label: "Maintenance"
          },
          15: {
            label: "Morale Welfare and Recreation"
          },
          16: {
            label: "Mortuary Affairs/Graves Registration"
          },
          23: {
            label: "Ordnance"
          },
          24: {
            label: "Personnel Services"
          },
          25: {
            label: "Petroleum Oil and Lubricants"
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
          32: {
            label: "Replacement Holding Unit"
          },
          33: {
            label: "Sea Port of Debarkation/Sea Port of Embarkation"
          },
          35: {
            label: "Joint Information Bureau"
          },
          36: {
            label: "Transportation"
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
        label: "Emergency Operation (Land Units)"
      },
      20: {
        label: "Law Enforcement (Land Units)",
        options: {
          "01": {
            label: "ATF DOJ"
          },
          "02": {
            label: "Border Patrol"
          },
          "03": {
            label: "Customs Service"
          },
          "04": {
            label: "DEA"
          },
          "05": {
            label: "DOJ"
          },
          "06": {
            label: "FBI"
          },
          "07": {
            label: "Police"
          },
          "08": {
            label: "Prison"
          },
          "09": {
            label: "US Secret Service (USSS)"
          },
          10: {
            label: "TSA"
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
        label: "Civilian (Land Civilian)",
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
        label: "Weapon/Weapon System",
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
            label: "Air Defense Gun",
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
            label: "Air Defense Missile Launcher",
            options: {
              "01": {
                label: "Light"
              },
              "02": {
                label: "Light Transporter-Launcher and Radar (TLAR)"
              },
              "03": {
                label: "Light Tactical Landing Approach Radar (TELAR)"
              },
              "04": {
                label: "Medium"
              },
              "05": {
                label: "Medium TLAR"
              },
              "06": {
                label: "Medium TELAR Air Defense Missile Launcher"
              },
              "07": {
                label: "Heavy"
              },
              "08": {
                label: "Heavy TLAR"
              },
              "09": {
                label: "Heavy TELAR"
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
            label: "Nonlethal Weapon"
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
        label: "Vehicle",
        options: {
          "01": {
            label: "Armored Vehicle",
            options: {
              "01": {
                label: "Armored Fighting Vehicle"
              },
              "02": {
                label: "Armored Fighting Vehicle C2"
              },
              "03": {
                label: "Armored Personnel Carrier"
              },
              "04": {
                label: "Armored Personnel Carrier Ambulance"
              },
              "05": {
                label: "Armored Protected Vehicle"
              },
              "06": {
                label: "Armored Protected Vehicle Recovery"
              },
              "07": {
                label: "Armored Protected Medical Evacuation"
              },
              "08": {
                label: "Armored Personnel Carrier-Recovery"
              },
              "09": {
                label: "Combat Service Support Vehicle"
              },
              10: {
                label: "Light Wheeled Armored Vehicle"
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
        label: "Engineer Equipment",
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
                label: "Armored Carrier with Volcano"
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
                label: "Dozer-Armored"
              }
            }
          },
          12: {
            label: "Armored Assault"
          },
          13: {
            label: "Armored Engineer Recon Vehicle (AERV)"
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
            label: "Utility Vehicle"
          },
          "02": {
            label: "Medical"
          },
          "03": {
            label: "Medical Evacuation"
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
            label: "Petroleum-Oil and Lubricant"
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
        label: "Train",
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
        label: "Civilian Vehicle",
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
            label: "Tractor Trailer with Box",
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
            label: "Tractor Trailer with Flatbed",
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
        label: "Law Enforcement (Land Equipment)",
        options: {
          "01": {
            label: "ATF DOJ"
          },
          "02": {
            label: "Border Patrol"
          },
          "03": {
            label: "Customs Service"
          },
          "04": {
            label: "DEA"
          },
          "05": {
            label: "DOJ"
          },
          "06": {
            label: "FBI"
          },
          "07": {
            label: "Police"
          },
          "08": {
            label: "US Secret Service (USSS)"
          },
          "09": {
            label: "TSA"
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
            label: "CBRN Equipment"
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
              "Ground-based Midcourse Defense (GMD) Fire Control (GFC) Center"
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
            label: "Improvised Explosives Device (IED)"
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
        label: "Emergency Operation (Land Equipment)",
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
        label: "Manual Track (Land Equipment)"
      }
    },
    20: {
      11: {
        label: "Installation",
        options: {
          "01": {
            label: "Aircraft Production/Assembly"
          },
          "02": {
            label: "Ammunition and Explosives/Assembly"
          },
          "04": {
            label: "Armament Production"
          },
          "05": {
            label: "Black List Location"
          },
          "06": {
            label: "Chemical-Biological-Radiological and Nuclear (CBRN)"
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
          13: {
            label: "Mine"
          },
          14: {
            label: "Missile and Space System Production"
          },
          15: {
            label: "Nuclear (Non CBRN Defense)"
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
                label: "Displaced Persons / Refugee / Evacuees Camp"
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
                  "Bureau of Alcohol-Tobacco-Firearms and Explosives (ATF) (Department of Justice)"
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
            label: "Agriculture and Food",
            options: {
              "01": {
                label: "Agriculture Laboratory"
              },
              "02": {
                label: "Animal Feedlot"
              },
              "04": {
                label: "Farm/Ranch"
              },
              "08": {
                label: "Grain Storage"
              }
            }
          },
          "02": {
            label: "Banking- Finance- and Insurance",
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
                label: "Financial Services-Other"
              }
            }
          },
          "03": {
            label: "Commercial",
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
            label: "Educational Facilities",
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
            label: "Energy Facility",
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
          "08": {
            label: "Military",
            options: {
              "01": {
                label: "Military Armory"
              },
              "02": {
                label: "Military Base"
              }
            }
          },
          "09": {
            label: "Postal Services",
            options: {
              "01": {
                label: "Postal Distribution Center"
              },
              "02": {
                label: "Post Office"
              }
            }
          },
          10: {
            label: "Public Venues",
            options: {
              "01": {
                label: "Enclosed Facility"
              },
              "02": {
                label: "Open Facility"
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
            label: "Special Needs",
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
            label: "Telecommunications",
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
            label: "Transportation",
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
            label: "Water Supply",
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
                label: "Special Operations Forces (SOF)"
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
                label: "Single-Shot Rifle"
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
                label: "Machine Gun-Light"
              },
              "07": {
                label: "Machine Gun-Medium"
              },
              "08": {
                label: "Machine Gun-Heavy"
              },
              "09": {
                label: "Grenade Launcher"
              },
              10: {
                label: "Grenade Launcher-Light"
              },
              11: {
                label: "Grenade Launcher-Medium"
              },
              12: {
                label: "Grenade Launcher-Heavy"
              },
              13: {
                label: "Flamethrower"
              },
              14: {
                label: "Mortar"
              },
              15: {
                label: "Rocket Launcher-Single"
              },
              16: {
                label: "Rocket Launcher-Antitank"
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
            label: "Activity",
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
        label: "Military (Sea Surface)"
      },
      12: {
        label: "Military Combatant",
        options: {
          "01": {
            label: "Carrier"
          },
          "02": {
            label: "Surface Combatant- Line",
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
                label: "Command Ship"
              },
              "02": {
                label: "Assault- Non-specified"
              },
              "03": {
                label: "Assault Ship- General"
              },
              "04": {
                label: "Assault Ship- Multipurpose"
              },
              "05": {
                label: "Assault Ship- Helicopter"
              },
              "06": {
                label: "Transport Dock"
              },
              "07": {
                label: "Landing Ship"
              },
              "08": {
                label: "Landing Craft"
              }
            }
          },
          "04": {
            label: "Mine Warfare Ship",
            options: {
              "01": {
                label: "Mine Layer"
              },
              "02": {
                label: "Mine Sweeper"
              },
              "03": {
                label: "Mine Sweeper- Drone"
              },
              "04": {
                label: "Mine Hunter"
              },
              "05": {
                label: "Mine Countermeasures"
              },
              "06": {
                label: "Mine Countermeasures- Support Ship"
              }
            }
          },
          "05": {
            label: "Patrol Boat",
            options: {
              "01": {
                label: "Patrol Craft- Submarine Chaser/Escort- General"
              },
              "02": {
                label: "Patrol Ship- General"
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
                label: "Rigid-Hull Inflatable Boat"
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
            label: "Sea-Based X-Band (SBX) Radar"
          }
        }
      },
      13: {
        label: "Military Noncombatant",
        options: {
          "01": {
            label: "Auxiliary Ship",
            options: {
              "01": {
                label: "Ammunition Ship"
              },
              "02": {
                label: "Naval Stores Ship"
              },
              "03": {
                label: "Auxiliary Flag Ship"
              },
              "04": {
                label: "Intelligence Collector"
              },
              "05": {
                label: "Oceanographic Research Ship"
              },
              "06": {
                label: "Survey Ship"
              },
              "07": {
                label: "Hospital Ship"
              },
              "08": {
                label: "Naval Cargo Ship"
              },
              "09": {
                label: "Combat Support Ship- Fast"
              },
              10: {
                label: "Oiler- Replenishment"
              },
              11: {
                label: "Repair Ship"
              },
              12: {
                label: "Submarine Tender"
              },
              13: {
                label: "Tug- Ocean Going"
              }
            }
          },
          "02": {
            label: "Service Craft/Yard",
            options: {
              "01": {
                label: "Barge- Not Self-Propelled"
              },
              "02": {
                label: "Barge- Self-Propelled"
              },
              "03": {
                label: "Tug- Harbor"
              },
              "04": {
                label: "Launch"
              }
            }
          }
        }
      },
      14: {
        label: "Civilian (Sea Surface)",
        options: {
          "01": {
            label: "Merchant Ship",
            options: {
              "01": {
                label: "Cargo- General"
              },
              "02": {
                label: "Container Ship"
              },
              "03": {
                label: "Dredge"
              },
              "04": {
                label: "Roll On/Roll Off"
              },
              "05": {
                label: "Ferry"
              },
              "06": {
                label: "Heavy Lift"
              },
              "07": {
                label: "Hovercraft"
              },
              "08": {
                label: "Lash Carrier (with Barges)"
              },
              "09": {
                label: "Oiler/Tanker"
              },
              10: {
                label: "Passenger"
              },
              11: {
                label: "Tug- Ocean Going"
              },
              12: {
                label: "Tow"
              },
              13: {
                label: "Transport Ship- Hazardous Material"
              },
              14: {
                label: "Junk/Dhow"
              },
              15: {
                label: "Barge- Not Self-Propelled"
              },
              16: {
                label: "Hospital Ship"
              }
            }
          },
          "02": {
            label: "Fishing Vessel",
            options: {
              "01": {
                label: "Drifter"
              },
              "02": {
                label: "Trawler"
              },
              "03": {
                label: "Dredger"
              }
            }
          },
          "03": {
            label: "Law Enforcement Vessel"
          },
          "04": {
            label: "Leisure Craft- Sailing"
          },
          "05": {
            label: "Leisure Craft- Motorized",
            options: {
              "01": {
                label: "Rigid-Hull Inflatable Boat"
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
        label: "Fused Track (Sea Surface)"
      },
      17: {
        label: "Manual Track (Sea Surface)"
      }
    },
    35: {
      11: {
        label: "Military (Sea Subsurface)",
        options: {
          "01": {
            label: "Submarine",
            options: {
              "01": {
                label: "Submarine-Surfaced"
              },
              "02": {
                label: "Submarine-Snorkeling"
              },
              "03": {
                label: "Submarine-Bottomed"
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
            label: "Autonomous Underwater Vehicle (AUV)"
          },
          "05": {
            label: "Diver"
          }
        }
      },
      12: {
        label: "Civilian (Sea Subsurface)",
        options: {
          "01": {
            label: "Submersible"
          },
          "02": {
            label: "Autonomous Underwater Vehicle (AUV)"
          },
          "03": {
            label: "Diver"
          }
        }
      },
      13: {
        label: "Weapon (Sea Subsurface)",
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
        label: "Fused Track (Sea Subsurface)"
      },
      16: {
        label: "Manual Track (Sea Subsurface)"
      },
      20: {
        label: "Seabed Installation, Human-Made, Military"
      },
      21: {
        label: "Seabed Installation, Human-Made, Non-Military"
      }
    },
    36: {
      11: {
        label: "Sea Mine-General",
        options: {
          "01": {
            label: "Sea Mine-Bottom"
          },
          "02": {
            label: "Sea Mine-Moored"
          },
          "03": {
            label: "Sea Mine-Floating"
          },
          "04": {
            label: "Sea Mine-Rising"
          },
          "05": {
            label: "Sea Mine-Other Position"
          },
          "08": {
            label: "Exercise Mine-General",
            options: {
              "01": {
                label: "Exercise Mine-Bottom"
              },
              "02": {
                label: "Exercise Mine-Moored"
              },
              "03": {
                label: "Exercise Mine-Floating"
              },
              "04": {
                label: "Exercise Mine-Rising"
              }
            }
          },
          "09": {
            label: "Neutralized",
            options: {
              "01": {
                label: "Neutralized Mine-Bottom"
              },
              "02": {
                label: "Neutralized Mine-Moored"
              },
              "03": {
                label: "Neutralized Mine-Floating"
              },
              "04": {
                label: "Neutralized Mine-Rising"
              },
              "05": {
                label: "Neutralized Mine-Other Position"
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
            label: "Sea Mine Decoy-Bottom"
          },
          "02": {
            label: "Sea Mine Decoy-Moored"
          }
        }
      },
      14: {
        label: "MILCO",
        options: {
          "01": {
            label: "General",
            options: {
              "01": {
                label: "General-Confidence-Level 1"
              },
              "02": {
                label: "General-Confidence-Level 2"
              },
              "03": {
                label: "General-Confidence-Level 3"
              },
              "04": {
                label: "General-Confidence-Level 4"
              },
              "05": {
                label: "General-Confidence-Level 5"
              }
            }
          },
          "02": {
            label: "Bottom",
            options: {
              "01": {
                label: "Bottom-Confidence-Level 1"
              },
              "02": {
                label: "Bottom-Confidence-Level 2"
              },
              "03": {
                label: "Bottom-Confidence-Level 3"
              },
              "04": {
                label: "Bottom-Confidence-Level 4"
              },
              "05": {
                label: "Bottom-Confidence-Level 5"
              }
            }
          },
          "03": {
            label: "Moored",
            options: {
              "01": {
                label: "Moored-Confidence-Level 1"
              },
              "02": {
                label: "Moored-Confidence-Level 2"
              },
              "03": {
                label: "Moored-Confidence-Level 3"
              },
              "04": {
                label: "Moored-Confidence-Level 4"
              },
              "05": {
                label: "Moored-Confidence-Level 5"
              }
            }
          },
          "04": {
            label: "Floating",
            options: {
              "01": {
                label: "Floating-Confidence-Level 1"
              },
              "02": {
                label: "Floating-Confidence-Level 2"
              },
              "03": {
                label: "Floating-Confidence-Level 3"
              },
              "04": {
                label: "Floating-Confidence-Level 4"
              },
              "05": {
                label: "Floating-Confidence-Level 5"
              }
            }
          }
        }
      },
      15: {
        label: "Mine-Like Echo (MILEC)-General",
        options: {
          "01": {
            label: "Mine-Like Echo-Bottom"
          },
          "02": {
            label: "Mine-Like Echo-Moored"
          },
          "03": {
            label: "Mine-Like Echo-Floating"
          }
        }
      },
      16: {
        label: "Negative Reacquisition-General",
        options: {
          "01": {
            label: "Negative Reacquisition-Bottom"
          },
          "02": {
            label: "Negative Reacquisition-Moored"
          },
          "03": {
            label: "Negative Reacquisition-Floating"
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
        label: "NMLO-General",
        options: {
          "01": {
            label: "Non-Mine Mine-Like Object-Bottom"
          },
          "02": {
            label: "Non-Mine Mine-Like Object-Moored"
          },
          "03": {
            label: "Non-Mine Mine-Like Object-Floating"
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
            label: "Psychological Operations (PSYOPS)"
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
              "03": {
                label: "Emergency Incident Command Center"
              },
              "04": {
                label: "Emergency Operations Center"
              },
              "05": {
                label: "Emergency Public Information Center"
              },
              "06": {
                label: "Emergency Shelter"
              },
              "07": {
                label: "Emergency Staging Area"
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
                label: "ATF"
              },
              "02": {
                label: "Border Patrol"
              },
              "03": {
                label: "Customs Service"
              },
              "04": {
                label: "DEA"
              },
              "05": {
                label: "DOJ"
              },
              "06": {
                label: "FBI"
              },
              "07": {
                label: "Police"
              },
              "08": {
                label: "Prison"
              },
              "09": {
                label: "USSS"
              },
              10: {
                label: "TSA"
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
        label: "Hazard Materials",
        options: {
          "01": {
            label: "Incident",
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
                label: "Earthquake Epicenter"
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
        label: "Signal Intercept (Space)",
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
        label: "Signal Intercept (Air)",
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
        label: "Signal Intercept (Land)",
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
        label: "Signal Intercept (Sea Surface)",
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
        label: "Signal Intercept (Sea Subsurface)",
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
        label: "Botnet",
        options: {
          "01": {
            label: "Command and Control (C2)"
          },
          "02": {
            label: "Herder"
          },
          "03": {
            label: "Callback Domain"
          },
          "04": {
            label: "Zombie"
          }
        }
      },
      12: {
        label: "Infection",
        options: {
          "01": {
            label: "APT",
            options: {
              "01": {
                label: "APT with C2"
              },
              "02": {
                label: "APT with Self Propagation"
              },
              "03": {
                label: "APT with C2 and Self Propagation"
              },
              "04": {
                label: "Other"
              }
            }
          },
          "02": {
            label: "NAPT",
            options: {
              "01": {
                label: "NAPT with C2"
              },
              "02": {
                label: "NAPT with Self Propagation"
              },
              "03": {
                label: "NAPT with C2 and Self Propagation"
              },
              "04": {
                label: "Other"
              }
            }
          }
        }
      },
      13: {
        label: "Health and Status",
        options: {
          "01": {
            label: "Normal"
          },
          "02": {
            label: "Network Outage"
          },
          "03": {
            label: "Unknown"
          },
          "04": {
            label: "Impaired"
          }
        }
      },
      14: {
        label: "Device Type",
        options: {
          "01": {
            label: "Core Router"
          },
          "02": {
            label: "Router"
          },
          "03": {
            label: "Cross Domain Solution"
          },
          "04": {
            label: "Mail Server"
          },
          "05": {
            label: "Web Server"
          },
          "06": {
            label: "Domain Server"
          },
          "07": {
            label: "File Server"
          },
          "08": {
            label: "Peer-to-Peer Node"
          },
          "09": {
            label: "Firewall"
          },
          10: {
            label: "Switch"
          },
          11: {
            label: "Host"
          },
          12: {
            label: "Virtual Private Network (VPN)"
          }
        }
      },
      15: {
        label: "Device Domain",
        options: {
          "01": {
            label: "Department of Defense (DoD)"
          },
          "02": {
            label: "Government"
          },
          "03": {
            label: "Contractor"
          },
          "04": {
            label: "Supervisory Control and Data Acquisition (SCADA)"
          },
          "05": {
            label: "Non-Government"
          }
        }
      },
      16: {
        label: "Effect",
        options: {
          "01": {
            label: "Infection"
          },
          "02": {
            label: "Degradation"
          },
          "03": {
            label: "Data Spoofing"
          },
          "04": {
            label: "Data Manipulation"
          },
          "05": {
            label: "Exfiltration"
          },
          "06": {
            label: "Power Outage"
          },
          "07": {
            label: "Network Outage"
          },
          "08": {
            label: "Service Outage"
          },
          "09": {
            label: "Device Outage"
          }
        }
      }
    },
    98: {
      10: {
        label: "Invalid Symbol"
      }
    }
  },
  app6sectorOneModifier: {
    "01": [
      {
        category: "Military Aircraft Type",
        values: {
          "01": "Attack/Strike",
          "02": "Bomber",
          "04": "Fighter",
          "05": "Interceptor",
          11: "Airborne Command Post (ACP)",
          12: "Airborne Early Warning (AEW)",
          33: "Fighter/Bomber"
        }
      },
      {
        category: "Aircraft Type",
        values: {
          "03": "Cargo",
          "06": "Tanker",
          "07": "Utility",
          "08": "VSTOL/VTOL",
          "09": "Passenger",
          10: "Ultra Light",
          13: "Government"
        }
      },
      {
        category: "Mission Area",
        values: {
          14: "Medical Evacuation (MEDEVAC)",
          17: "Patrol",
          18: "Reconnaissance",
          19: "Trainer",
          20: "Photographic (Reconnaissance)",
          21: "Personnel Recovery",
          23: "Communications",
          26: "Search and Rescue",
          29: "Very Important Person (VIP) Transport",
          34: "Intensive Care",
          36: "Multimission",
          38: "ASW Helo - LAMPS",
          39: "ASW Helo - SH-60R"
        }
      },
      {
        category: "Military Mission Area",
        values: {
          15: "Escort",
          16: "Electronic Combat (EC)/Jammer",
          22: "Antisubmarine Warfare",
          24: "Electronic Support Measures (ESM)",
          25: "Mine Countermeasures (MCM)",
          27: "Special Operations Forces",
          28: "Surface Warfare",
          30: "Combat Search and Rescue (CSAR)",
          31: "Suppression of Enemy Air Defenses",
          32: "Antisurface Warfare",
          35: "Electronic Attack (EA)"
        }
      },
      {
        category: "Crime",
        values: {
          37: "Hijacking (Air)"
        }
      }
    ],
    "02": [
      {
        category: "Launch Origin",
        values: {
          "01": "Air",
          "02": "Surface",
          "03": "Subsurface",
          "04": "Space"
        }
      },
      {
        category: "Missile Class",
        values: {
          "05": "Anti-Ballistic",
          "06": "Ballistic (Air Missile)",
          "07": "Cruise",
          "08": "Interceptor (Air Missile)"
        }
      }
    ],
    "05": {
      "01": "Low Earth Orbit (LEO)",
      "02": "Medium Earth Orbit (MEO)",
      "03": "High Earth Orbit (HEO)",
      "04": "Geosynchronous Orbit (GSO)",
      "05": "Geostationary Orbit (GO)",
      "06": "Molniya Orbit (MO)"
    },
    "06": [
      {
        category: "Missile Class",
        values: {
          "01": "Ballistic (Space Missile)",
          "03": "Interceptor (Space Missile)"
        }
      },
      {
        category: "Launch Origin",
        values: {
          "02": "Space 1"
        }
      }
    ],
    10: [
      {
        category: "Mobility",
        values: {
          "01": "Air Mobile/Air Assault (US Only)"
        }
      },
      {
        category: "Capability",
        values: {
          "02": "Area",
          "03": "Attack 1",
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
          15: "Decontamination 1",
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
          38: "Movement Control Center",
          39: "Multinational",
          40: "Multinational Specialized Unit",
          41: "Multiple Rocket Launcher",
          42: "NATO Medical Role 1",
          43: "NATO Medical Role 2",
          44: "NATO Medical Role 3",
          45: "NATO Medical Role 4",
          46: "Naval",
          47: "Node Center",
          48: "Nuclear",
          49: "Operations",
          50: "Radar",
          51: "RFID Interrogator/Sensor",
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
          69: "Utility 1",
          70: "Video Imagery (Combat Camera)",
          74: "Antisubmarine Warfare",
          75: "Medevac",
          76: "Ranger",
          77: "Support 1",
          78: "Aviation"
        }
      },
      {
        category: "Composite Loss",
        values: {
          71: "Accident (Land Units)",
          72: "Other (Land Units)"
        }
      },
      {
        category: "Operation",
        values: {
          73: "Civilian (Land Units)"
        }
      }
    ],
    11: [
      {
        category: "Crime",
        values: {
          "01": "Assassination (Land Civilian)",
          "02": "Execution (Wrongful Killing) (Land Civilian)",
          "03": "Murder Victims",
          "04": "Hijacking (Land Civilian)",
          "05": "Kidnapping (Land Civilian)",
          "06": "Piracy (Land Civilian)",
          "07": "Rape (Land Civilian)",
          24: "Loot"
        }
      },
      {
        category: "Organization",
        values: {
          "08": "Civilian (Land Civilian)",
          "09": "Displaced Person(s)- Refugee(s) and Evacuee(s)",
          10: "Foreign Fighter(s)",
          11: "Gang Member or Gang",
          12: "Government Organization",
          13: "Leader or Leadership 1",
          14: "Nongovernmental Organization Member or Nongovernmental Organization",
          15: "Coerced/Impressed Recruit",
          16: "Willing Recruit",
          17: "Religious or Religious Organization",
          18: "Targeted Individual or Organization",
          19: "Terrorist or Terrorist Organization",
          20: "Speaker"
        }
      },
      {
        category: "Composite Loss",
        values: {
          21: "Accident (Land Civilian)",
          22: "Combat",
          23: "Other (Land Civilian)"
        }
      }
    ],
    15: [
      {
        category: "Sensor Type",
        values: {
          "01": "Biological",
          "02": "Chemical",
          "03": "Early Warning Radar",
          "04": "Intrusion",
          "05": "Nuclear",
          "06": "Radiological",
          "07": "Upgraded Early Warning Radar"
        }
      },
      {
        category: "Crime",
        values: {
          "08": "Hijacking (Land Equipment)"
        }
      },
      {
        category: "Organization",
        values: {
          "09": "Civilian (Land Equipment)"
        }
      }
    ],
    20: [
      {
        category: "CBRN Type",
        values: {
          "01": "Biological",
          "02": "Chemical",
          "03": "Nuclear",
          "04": "Radiological",
          "05": "Decontamination"
        }
      },
      {
        category: "Electric Power Type",
        values: {
          "06": "Coal",
          "07": "Geothermal",
          "08": "Hydroelectric",
          "09": "Natural Gas",
          10: "Petroleum"
        }
      },
      {
        category: "Operation",
        values: {
          11: "Civilian (Land Installation)"
        }
      },
      {
        category: "Civilian Telecommunications Type",
        values: {
          12: "Civilian Telephone",
          13: "Civilian Television"
        }
      }
    ],
    27: [
      {
        category: "Task",
        values: {
          "01": "Close Protection",
          "02": "Crowd and Riot Control",
          "03": "Explosive Ordnance Disposal (EOD)",
          "04": "Security",
          "05": "Sniper",
          "06": "Special Weapons and Tactics",
          11: "Video Imagery (Combat Camera)"
        }
      },
      {
        category: "Organization",
        values: {
          "07": "Non-Governmental Organization Member",
          "08": "Multinational",
          "09": "Multinational Specialized Unit",
          10: "Governmental Organization Member"
        }
      },
      {
        category: "Functional Staff Area",
        values: {
          12: "J1",
          13: "J2",
          14: "J3",
          15: "J4",
          16: "J5",
          17: "J6",
          18: "J7",
          19: "J8",
          20: "J9"
        }
      },
      {
        category: "Rank",
        values: {
          21: "OF-1",
          22: "OF-2",
          23: "OF-3",
          24: "OF-4",
          25: "OF-5",
          26: "OF-6",
          27: "OF-7",
          28: "OF-8",
          29: "OF-9",
          30: "OF-10",
          31: "OF-D",
          32: "OR-1",
          33: "OR-2",
          34: "OR-3",
          35: "OR-4",
          36: "OR-5",
          37: "OR-6",
          38: "OR-7",
          39: "OR-8",
          40: "OR-9",
          41: "WO-1",
          42: "WO-2",
          43: "WO-3",
          44: "WO-4",
          45: "WO-5"
        }
      },
      {
        category: "Echelon",
        values: {
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
        }
      }
    ],
    30: [
      {
        category: "Mission Area",
        values: {
          "01": "Own Ship",
          "02": "Antiair Warfare",
          "03": "Antisubmarine Warfare (Sea Surface)",
          "04": "Escort",
          "05": "Electronic Warfare",
          "06": "Intelligence- Surveillance- Reconnaissance",
          "07": "Mine Countermeasures (Sea Surface)",
          "08": "Missile Defense",
          "09": "Medical",
          10: "Mine Warfare (Sea Surface)",
          11: "Remote Multi-Mission Vehicle (USV-only)",
          13: "Surface Warfare (Sea Surface)",
          20: "Ballistic Missile Defense- Shooter",
          21: "Ballistic Missile Defense- Long-Range Surveillance and Track (LRST)",
          22: "Sea-Base X-Band"
        }
      },
      {
        category: "Asset Capability",
        values: {
          12: "SOF (Sea Surface)",
          18: "Drone-Equipped",
          19: "Helicopter-Equipped/VSTOL"
        }
      },
      {
        category: "Weapons Capability",
        values: {
          14: "Ballistic Missile (Sea Surface)",
          15: "Guided Missile (Sea Surface)",
          16: "Other Guided Missile (Sea Surface)",
          17: "Torpedo"
        }
      },
      {
        category: "Crime",
        values: {
          23: "Hijacking/Hijacked (Sea Surface)"
        }
      }
    ],
    35: [
      {
        category: "Mission Area",
        values: {
          "01": "Antisubmarine Warfare (Sea Subsurface)",
          "02": "Auxiliary",
          "03": "Command and Control",
          "04": "Intelligence Surveillance Reconnaissance",
          "05": "Mine Countermeasures (Sea Subsurface)",
          "06": "Mine Warfare (Sea Subsurface)",
          "07": "Surface Warfare (Sea Subsurface)"
        }
      },
      {
        category: "Weapons Capability",
        values: {
          "08": "Attack",
          "09": "Ballistic Missile (Sea Subsurface)",
          10: "Guided Missile (Sea Subsurface)",
          11: "Other Guided Missile (Sea Subsurface)",
          19: "Anti-torpedo Torpedo"
        }
      },
      {
        category: "Asset Capability",
        values: {
          12: "SOF (Sea Subsurface)"
        }
      },
      {
        category: "Submarine Confidence",
        values: {
          13: "Possible Submarine Low 1",
          14: "Possible Submarine Low 2",
          15: "Possible Submarine High 3",
          16: "Possible Submarine High 4",
          17: "Probable Submarine",
          18: "Certain Submarine"
        }
      },
      {
        category: "Crime",
        values: {
          20: "Hijacking/Highjacked"
        }
      }
    ],
    40: [
      {
        category: "Crime",
        values: {
          "01": "Assassination (Activities)",
          "02": "Execution (Wrongful Killing) (Activities)",
          "03": "Hijacking/Hijacked (Activities)",
          "05": "Kidnapping (Activities)",
          "06": "Murder",
          "07": "Piracy (Activities)",
          "08": "Rape (Activities)",
          10: "Pirate",
          18: "Theft"
        }
      },
      {
        category: "Psychological Operations",
        values: {
          "04": "House-to-House",
          "09": "Written Psychological Operations"
        }
      },
      {
        category: "IED Category",
        values: {
          11: "False",
          12: "Find",
          13: "Found and Cleared",
          14: "Hoax (Decoy)"
        }
      },
      {
        category: "Incident Qualifier",
        values: {
          15: "Attempted",
          16: "Accident",
          17: "Incident"
        }
      }
    ],
    50: [
      {
        category: "Radar",
        values: {
          14: "Data Transmission (Space)",
          15: "Earth Surveillance",
          21: "Identification Friend or Foe (Interrogator) (Space)",
          24: "Identification Friend or Foe (Transponder) (Space)",
          50: "Instrumentation (Space)",
          51: "Range Only (Space)",
          54: "Space (Space)",
          55: "Surface Search (Space)",
          61: "Target Tracking (Space)",
          62: "Unknown (Space)",
          63: "Video Remoting (Space)",
          64: "Experimental (Space)"
        }
      },
      {
        category: "Jammer",
        values: {
          25: "Barrage Jammer (Space)",
          26: "Click Jammer (Space)",
          27: "Deceptive Jammer (Space)",
          28: "Frequency Swept Jammer (Space)",
          29: "Jammer (General) (Space)",
          30: "Noise Jammer (Space)",
          31: "Pulsed Jammer (Space)",
          32: "Repeater Jammer (Space)",
          33: "Spot Noise Jammer (Space)",
          34: "Transponder Jammer (Space)",
          36: "Missile Control (Space)",
          39: "Multi-Function (Space)",
          42: "Missile Tracking (Space)",
          43: "Navigational/General (Space)",
          44: "Navigational/Distance Measuring Equipment (Space)",
          45: "Navigation/Terrain Following (Space)",
          58: "Target Acquisition (Space)"
        }
      },
      {
        category: "Communications",
        values: {
          49: "Point-to-Point Line of Sight (LOS) (Space)",
          53: "Satellite Downlink (Space)"
        }
      }
    ],
    51: [
      {
        category: "Radar",
        values: {
          "02": "Airborne Search and Bombing",
          "03": "Airborne Intercept",
          "04": "Altimeter",
          "05": "Airborne Reconnaissance and Mapping",
          "06": "Air Traffic Control (Air)",
          "07": "Beacon Transponder (not IFF) (Air)",
          "08": "Battlefield Surveillance (Air)",
          10: "Controlled Intercept (Air)",
          12: "Coastal Surveillance",
          13: "Decoy/Mimic",
          14: "Data Transmission (Air)",
          16: "Early Warning (Air)",
          17: "Fire Control (Air)",
          18: "Ground Mapping",
          21: "Identification Friend or Foe (Interrogator) (Air)",
          23: "Ionospheric Sounding (Air)",
          24: "Identification Friend or Foe (Transponder) (Air)",
          35: "Missile Acquisition (Air)",
          36: "Missile Control (Air)",
          37: "Missile Downlink",
          38: "Meteorological (Air)",
          40: "Missile Guidance (Air)",
          41: "Missile Homing",
          48: "Proximity Use",
          50: "Instrumentation (Air)",
          51: "Range Only (Air)",
          54: "Space (Air)",
          55: "Surface Search (Air)",
          57: "Satellite Uplink",
          58: "Target Acquisition",
          59: "Target Illumination (Air)",
          61: "Target Tracking (Air)",
          62: "Unknown (Air)",
          63: "Video Remoting (Air)",
          64: "Experimental (Air)"
        }
      },
      {
        category: "Communications",
        values: {
          11: "Cellular/Mobile (Air)",
          47: "Omni-Line of Sight (LOS) (Air)",
          49: "Point-to-Point Line of Sight (LOS) (Air)"
        }
      },
      {
        category: "Jammer",
        values: {
          25: "Barrage Jammer (Air)",
          26: "Click Jammer (Air)",
          27: "Deceptive Jammer (Air)",
          28: "Frequency Swept Jammer (Air)",
          29: "Jammer (General) (Air)",
          30: "Noise Jammer (Air)",
          31: "Pulsed Jammer (Air)",
          32: "Repeater Jammer (Air)",
          33: "Spot Noise Jammer (Air)",
          34: "Transponder Jammer (Air)",
          39: "Multi-Function (Air)",
          42: "Missile Tracking (Air)",
          43: "Navigational/General (Air)",
          44: "Navigational/Distance Measuring Equipment (Air)",
          45: "Navigation/Terrain Following (Air)",
          46: "Navigational/Weather Avoidance (Air)"
        }
      }
    ],
    52: [
      {
        category: "Radar",
        values: {
          "01": "Anti-Aircraft Fire Control (Land)",
          "06": "Air Traffic Control (Land)",
          "07": "Beacon Transponder (not IFF) (Land)",
          "08": "Battlefield Surveillance (Land)",
          "09": "Controlled Approach (Land)",
          10: "Controlled Intercept (Land)",
          14: "Data Transmission (Land)",
          16: "Early Warning (Land)",
          17: "Fire Control (Land)",
          19: "Height Finding (Land)",
          20: "Harbor Surveillance",
          21: "Identification Friend or Foe (Interrogator) (Land)",
          22: "Instrument Landing System (Land)",
          23: "Ionospheric Sounding (Land)",
          24: "Identification Friend or Foe (Transponder) (Land)",
          35: "Missile Acquisition (Land)",
          38: "Meteorological (Land)",
          40: "Missile Guidance (Land)",
          50: "Instrumentation (Land)",
          51: "Range Only (Land)",
          54: "Space (Land)",
          55: "Surface Search (Land)",
          56: "Shell Tracking",
          59: "Target Illumination (Land)",
          61: "Target Tracking (Land)",
          62: "Unknown (Land)",
          63: "Video Remoting (Land)",
          64: "Experimental (Land)"
        }
      },
      {
        category: "Communications",
        values: {
          11: "Cellular/Mobile (Land)",
          47: "Omni-Line of Sight (LOS) (Land)",
          49: "Point-to-Point Line of Sight (LOS) (Land)",
          57: "Satellite Uplink (Land)",
          60: "Tropospheric Scatter"
        }
      },
      {
        category: "Jammer",
        values: {
          13: "Decoy/Mimic (Land)",
          25: "Barrage Jammer (Land)",
          26: "Click Jammer (Land)",
          27: "Deceptive Jammer (Land)",
          28: "Frequency Swept Jammer (Land)",
          29: "Jammer (General) (Land)",
          30: "Noise Jammer (Land)",
          31: "Pulsed Jammer (Land)",
          32: "Repeater Jammer (Land)",
          33: "Spot Noise Jammer (Land)",
          34: "Transponder Jammer (Land)",
          36: "Missile Control (Land)",
          39: "Multi-Function (Land)",
          42: "Missile Tracking (Land)",
          43: "Navigational/General (Land)",
          44: "Navigational/Distance Measuring Equipment (Land)",
          45: "Navigation/Terrain Following (Land)",
          46: "Navigational/Weather Avoidance (Land)",
          58: "Target Acquisition (Land)"
        }
      }
    ],
    53: [
      {
        category: "Radar",
        values: {
          "01": "Anti-Aircraft Fire Control (Sea Surface)",
          "06": "Air Traffic Control (Sea Surface)",
          "07": "Beacon Transponder (not IFF) (Sea Surface)",
          "09": "Controlled Approach (Sea Surface)",
          10: "Controlled Intercept (Sea Surface)",
          14: "Data Transmission (Sea Surface)",
          16: "Early Warning (Sea Surface)",
          17: "Fire Control (Sea Surface)",
          19: "Height Finding (Sea Surface)",
          21: "Identification Friend or Foe (Interrogator) (Sea Surface)",
          22: "Instrument Landing System (Sea Surface)",
          24: "Identification Friend or Foe (Transponder) (Sea Surface)",
          35: "Missile Acquisition (Sea Surface)",
          38: "Meteorological (Sea Surface)",
          40: "Missile Guidance (Sea Surface)",
          50: "Instrumentation (Sea Surface)",
          51: "Range Only (Sea Surface)",
          52: "Sonobuoy (Sea Surface)",
          54: "Space (Sea Surface)",
          55: "Surface Search (Sea Surface)",
          59: "Target Illumination (Sea Surface)",
          61: "Target Tracking (Sea Surface)",
          62: "Unknown (Sea Surface)",
          63: "Video Remoting (Sea Surface)",
          64: "Experimental (Sea Surface)"
        }
      },
      {
        category: "Communications",
        values: {
          11: "Cellular/Mobile (Sea Surface)",
          49: "Point-to-Point Line of Sight (LOS) (Sea Surface)",
          57: "Satellite Uplink (Sea Surface)"
        }
      },
      {
        category: "Jammer",
        values: {
          13: "Decoy/Mimic (Sea Surface)",
          25: "Barrage Jammer (Sea Surface)",
          26: "Click Jammer (Sea Surface)",
          27: "Deceptive Jammer (Sea Surface)",
          28: "Frequency Swept Jammer (Sea Surface)",
          29: "Jammer (General) (Sea Surface)",
          30: "Noise Jammer (Sea Surface)",
          31: "Pulsed Jammer (Sea Surface)",
          32: "Repeater Jammer (Sea Surface)",
          33: "Spot Noise Jammer (Sea Surface)",
          34: "Transponder Jammer (Sea Surface)",
          36: "Missile Control (Sea Surface)",
          39: "Multi-Function (Sea Surface)",
          42: "Missile Tracking (Sea Surface)",
          43: "Navigational/General (Sea Surface)",
          44: "Navigational/Distance Measuring Equipment (Sea Surface)",
          45: "Navigation/Terrain Following (Sea Surface)",
          46: "Navigational/Weather Avoidance (Sea Surface)",
          58: "Target Acquisition (Sea Surface)"
        }
      },
      {
        category: "Air/Land/Sea Surface/Subsurface Communications",
        values: {
          47: "Omni-Line of Sight (LOS) (Sea Surface)"
        }
      }
    ],
    54: [
      {
        category: "Radar",
        values: {
          "07": "Beacon Transponder (not IFF) (Sea Subsurface)",
          14: "Data Transmission (Sea Subsurface)",
          16: "Early Warning (Sea Subsurface)",
          21: "Identification Friend or Foe (Interrogator) (Sea Subsurface)",
          24: "Identification Friend or Foe (Transponder) (Sea Subsurface)",
          50: "Instrumentation (Sea Subsurface)",
          51: "Range Only (Sea Subsurface)",
          52: "Sonobuoy (Sea Subsurface)",
          54: "Space (Sea Subsurface)",
          55: "Surface Search (Sea Subsurface)",
          61: "Target Tracking (Sea Subsurface)",
          62: "Unknown (Sea Subsurface)",
          63: "Video Remoting (Sea Subsurface)",
          64: "Experimental (Sea Subsurface)"
        }
      },
      {
        category: "Communications",
        values: {
          11: "Cellular/Mobile (Sea Subsurface)",
          47: "Omni-Line of Sight (LOS) (Sea Subsurface)",
          49: "Point-to-Point Line of Sight (LOS) (Sea Subsurface)",
          57: "Satellite Uplink (Sea Subsurface)"
        }
      },
      {
        category: "Jammer",
        values: {
          13: "Decoy/Mimic (Sea Subsurface)",
          25: "Barrage Jammer (Sea Subsurface)",
          26: "Click Jammer (Sea Subsurface)",
          27: "Deceptive Jammer (Sea Subsurface)",
          28: "Frequency Swept Jammer (Sea Subsurface)",
          29: "Jammer (General) (Sea Subsurface)",
          30: "Noise Jammer (Sea Subsurface)",
          31: "Pulsed Jammer (Sea Subsurface)",
          32: "Repeater Jammer (Sea Subsurface)",
          33: "Spot Noise Jammer (Sea Subsurface)",
          34: "Transponder Jammer (Sea Subsurface)",
          36: "Missile Control (Sea Subsurface)",
          39: "Multi-Function (Sea Subsurface)",
          42: "Missile Tracking (Sea Subsurface)",
          43: "Navigational/General (Sea Subsurface)",
          44: "Navigational/Distance Measuring Equipment (Sea Subsurface)",
          45: "Navigation/Terrain Following (Sea Subsurface)",
          46: "Navigational/Weather Avoidance (Sea Subsurface)",
          58: "Target Acquisition (Sea Subsurface)"
        }
      }
    ]
  },
  app6sectorTwoModifier: {
    "01": [
      {
        category: "Cargo/Transport Capacity",
        values: {
          "01": "Heavy",
          "02": "Medium",
          "03": "Light"
        }
      },
      {
        category: "Re-fueling Capability",
        values: {
          "04": "Boom-Only",
          "05": "Drogue-Only",
          "06": "Boom and Drogue"
        }
      },
      {
        category: "Range",
        values: {
          "07": "Close Range",
          "08": "Short Range",
          "09": "Medium Range",
          10: "Long Range"
        }
      },
      {
        category: "Track Link Availability",
        values: {
          11: "Downlinked"
        }
      }
    ],
    "02": [
      {
        category: "Missile Destination",
        values: {
          "01": "Air",
          "02": "Surface",
          "03": "Subsurface",
          "04": "Space"
        }
      },
      {
        category: "Missile Status",
        values: {
          "05": "Launched",
          "06": "Missile"
        }
      },
      {
        category: "Missile Type-BMD",
        values: {
          "07": "Patriot"
        }
      },
      {
        category: "Missile Type-AAW",
        values: {
          "08": "Standard Missile-2 (SM-2)",
          "09": "Standard Missile-6 (SM-6)",
          10: "Evolved Sea Sparrow Missile (ESSM)",
          11: "Rolling Airframe Missile (RAM)"
        }
      },
      {
        category: "Missile Range",
        values: {
          12: "Short Range (Air Missile)",
          13: "Medium Range (Air Missile)",
          14: "Intermediate Range (Air Missile)",
          15: "Long Range (Air Missile)",
          16: "Intercontinental (Air Missile)"
        }
      }
    ],
    "05": {
      "01": "Optical",
      "02": "Infrared",
      "03": "Radar",
      "04": "Signals Intelligence (SIGINT)"
    },
    "06": [
      {
        category: "Missile Range",
        values: {
          "01": "Short Range (Space Missile)",
          "02": "Medium Range (Space Missile)",
          "03": "Intermediate Range (Space Missile)",
          "04": "Long Range (Space Missile)",
          "05": "Intercontinental (Space Missile)"
        }
      },
      {
        category: "Missile Type - BMD",
        values: {
          "06": "Arrow",
          "07": "Ground-Based Interceptor (GBI)",
          "08": "Patriot",
          "09": "Standard Missile - Terminal Phase (SM-T)",
          10: "Standard Missile - 3 (SM-3)",
          11: "Terminal High-Altitude Area Defense (THAAD)"
        }
      },
      {
        category: "Launch Origin",
        values: {
          12: "Space 2"
        }
      }
    ],
    10: [
      {
        category: "Mobility",
        values: {
          "01": "Airborne",
          "02": "Arctic",
          "04": "Bicycle Equipped",
          36: "Railroad",
          40: "Riverine",
          42: "Ski",
          47: "Towed",
          49: "Vertical or Short Take-Off and Landing (VTOL/VSTOL)",
          51: "Wheeled"
        }
      },
      {
        category: "Capability",
        values: {
          "03": "Battle Damage Repair",
          "06": "Clearing",
          "07": "Close Range",
          "08": "Control",
          "09": "Decontamination 2",
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
          37: "Recovery (Unmanned Systems)",
          38: "Recovery (Maintenance)",
          39: "Rescue Coordination Center",
          41: "Single Channel",
          43: "Short Range",
          44: "Strategic",
          45: "Support 2",
          46: "Tactical",
          48: "Troop",
          50: "Veterinary",
          52: "High to Low Altitude",
          53: "Medium to Low Altitude",
          54: "Attack 2",
          55: "Refuel",
          56: "Utility 2",
          57: "Combat Search and Rescue"
        }
      },
      {
        category: "Close Range and Support",
        values: {
          "05": "Casualty Staging"
        }
      }
    ],
    11: {
      "01": "Leader or Leadership 2"
    },
    20: {
      "01": "Biological",
      "02": "Chemical",
      "03": "Nuclear",
      "04": "Radiological",
      "05": "Atomic Energy Reactor",
      "06": "Nuclear Material Production",
      "07": "Nuclear Material Storage",
      "08": "Weapons Grade"
    },
    27: [
      {
        category: "Task",
        values: {
          "01": "Airborne",
          "02": "Bicycle Equipped",
          "03": "Demolition"
        }
      },
      {
        category: "Functional Staff Area",
        values: {
          "04": "J1",
          "05": "J2",
          "06": "J3",
          "07": "J4",
          "08": "J5",
          "09": "J6",
          10: "J7",
          11: "J8",
          12: "J9"
        }
      },
      {
        category: "Other",
        values: {
          13: "Mountain",
          39: "Ski"
        }
      },
      {
        category: "Rank",
        values: {
          14: "OF-1",
          15: "OF-2",
          16: "OF-3",
          17: "OF-4",
          18: "OF-5",
          19: "OF-6",
          20: "OF-7",
          21: "OF-8",
          22: "OF-9",
          23: "OF-10",
          24: "OF-D",
          25: "OR-1",
          26: "OR-2",
          27: "OR-3",
          28: "OR-4",
          29: "OR-5",
          30: "OR-6",
          31: "OR-7",
          32: "OR-8",
          33: "OR-9",
          34: "WO-1",
          35: "WO-2",
          36: "WO-3",
          37: "WO-4",
          38: "WO-5"
        }
      }
    ],
    30: [
      {
        category: "Ship Propulsion",
        values: {
          "01": "Nuclear Powered"
        }
      },
      {
        category: "Ship Capacity",
        values: {
          "02": "Heavy",
          "03": "Light",
          "04": "Medium"
        }
      },
      {
        category: "Cargo Capacity",
        values: {
          "05": "Dock",
          "06": "Logistics",
          "07": "Tank",
          "08": "Vehicle"
        }
      },
      {
        category: "Ship Mobility",
        values: {
          "09": "Fast",
          10: "Air-Cushioned (US)",
          11: "Air-Cushioned (NATO)",
          12: "Hydrofoil"
        }
      },
      {
        category: "USV Control",
        values: {
          13: "Autonomous Control",
          14: "Remotely Piloted",
          15: "Expendable"
        }
      }
    ],
    35: [
      {
        category: "Ship Propulsion",
        values: {
          "01": "Air Independent Propulsion",
          "02": "Diesel Electric General",
          "03": "Diesel - Type 1",
          "04": "Diesel - Type 2",
          "05": "Diesel - Type 3",
          "06": "Nuclear Powered General",
          "07": "Nuclear - Type 1",
          "08": "Nuclear - Type 2",
          "09": "Nuclear - Type 3",
          10: "Nuclear - Type 4",
          11: "Nuclear - Type 5",
          12: "Nuclear - Type 6",
          13: "Nuclear - Type 7"
        }
      },
      {
        category: "UUV Control",
        values: {
          14: "Autonomous Control",
          15: "Remotely Piloted",
          16: "Expendable"
        }
      }
    ]
  }
}
