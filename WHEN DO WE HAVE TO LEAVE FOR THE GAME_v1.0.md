WHEN DO WE HAVE TO LEAVE FOR THE GAME, DAD?
- Inputs:
-- 'start address'
-- minutes to 'get ready'
-- minutes 'before game' time, 60, 65, 70
-- 'Min wake' up time
- navitgate to the correct schedule on scaha.net (there's two pull downs)
- download the schedule in CSV
- Ask for the 'game date' they want to calculate
- extract from the CSV on the date of the game:
-- name of the venue
-- how to map the venue to the correct address and store it? 'end address'
-- 'game time'
-- home or away (to determine jersey color)

- Convert 'game time' to 'game time UTC', respecting daylight savings time
- Calculate arrival:
-- subtract 'get ready' and 'before game' from 'game time UTC'
-- That is our 'desired arrival UTC' time
- Using Google Routes API calculate 'leave time UTC'
-- 'start address'
-- 'end address'
-- 'desired arrival UTC'
-- 'game date'
-- Google maps api key

- Outputs:
## Game Information
- **Game Time**: <game_time>
- **Opponent**: <opponent>
- **Location**: <venue>
- **Address**: <endAddress>

## Timing Schedule
- **⏰ WAKE UP / GET READY TIME: <wakeup>**
- **🚗 LEAVE HOME BY: <leave>**
- **🏒 ARRIVE AT RINK: <arrive> (<before_interval> minutes before)**

## Travel Details
- **Estimated Drive Time**: <driveTime>


## Equipment Reminders
- **Jersey**: <jerseyColor> _Always bring both jerseys!_
- **Pre-game Meal**: 2-3 hours before game time unless it's a morning game, then a light carby snack, fruit, cereal, 
- **Water Bottle**: Don't Forget It!



- You need a hotel logic
-- if 'leave time UTC' is before 'Min wake' up time
-- then you need a hotel
-- trigger you need a hotel logic
-- Min number of stars
-- radius from 'end address'
-- search matching hotels with google maps api
-- provide link to google maps search for the hotels

Nice to haves:
- display team logo
- database of team logos
- scrape the venues and create a database of venues and addresses