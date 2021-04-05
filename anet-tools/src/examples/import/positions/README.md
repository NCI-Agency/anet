# Insert/Update Position

Since the positions table has a one-to-one relationship with the people, locations and organizations tables, as well as many-to-many relationships with the people table, there are many insert/update scenarios as in below. These scenarios are tested in test scripts. Examples related to the main ones are provided.

Associate existing person (has no former position) with existing position (has no former person)
Associate existing person (has former position) with existing position (has no former person)
Associate existing person (has no former position) with existing position (has former person)
Associate existing person (has former position) with existing position (has former person)
Associate existing person (has no former position) with new position
Associate existing person (has former position) with new position
Associate new person with existing position (has no former person)
Associate new person with existing position (has former person)
Associate new person with new position