/*
 * Content for the todo card. The completed steps carry the reasoning that
 * produced them; the in-progress step trails off mid-sentence, because it is
 * still streaming.
 */

export type Thought = string | { text?: string; bullets: string[] }

export type TodoItem = {
  id: string
  text: string
  status: 'done' | 'active' | 'todo'
  /** Filled panel with its own scroll area, for the step still running. */
  variant?: 'thread' | 'panel'
  detail?: Thought[]
}

export const ITEMS: TodoItem[] = [
  {
    id: 'destination',
    text: 'Choose beach destination and pick travel dates for the weekend',
    status: 'done',
    variant: 'thread',
    detail: [
      {
        text: 'Comparing beach destinations within a half-day of home:',
        bullets: [
          'Rehoboth Beach, DE — 3h drive, boardwalk, busiest in August',
          'Cape May, NJ — 3h30 drive, quieter, Victorian town center',
          'Outer Banks, NC — 6h drive, widest beaches, hardest to reach',
        ],
      },
      'Rehoboth is the best balance of drive time and things to do with two adults and two kids. The Outer Banks would mean most of Friday in the car.',
      'Checked the next three weekends: the 12th–14th is clear and 78°F, the 19th–21st has thunderstorms Friday night, and the 26th–28th is a holiday weekend, so rates jump and the boardwalk gets crowded.',
      'Going with Friday the 12th through Sunday the 14th.',
    ],
  },
  {
    id: 'accomodation',
    text: 'Book accomodation (hotel, condo, or beach house for family of 4)',
    status: 'done',
    variant: 'thread',
    detail: [
      {
        text: 'Filtered for two bedrooms, a kitchen, and under a ten-minute walk to the beach:',
        bullets: [
          'Beachwalk Condos, 2BR — $340/night, 4-minute walk, parking included',
          'Dune Cottage, 3BR house — $395/night, 6-minute walk, two-night minimum',
          'Sandpiper Inn, two rooms — $420/night, 8-minute walk, breakfast included',
        ],
      },
      'The condo is the cheapest of the three and the kitchen covers breakfast and lunch, worth roughly $120 across the weekend. Confirmed it sleeps four — one queen, two twins.',
      'Cancellation is free through the 5th, so this can be revisited if the forecast turns.',
      'Booked Beachwalk Condos, unit 214, Friday to Sunday.',
    ],
  },
  {
    id: 'transportation',
    text: 'Arrange transportation (flights, driving, rental car if needed)',
    status: 'done',
    variant: 'thread',
    detail: [
      'Driving wins here. The nearest airport is over an hour from Rehoboth, and four people plus beach gear fits in the car without a rental.',
      {
        text: 'Route is I-95 south to US-1, about three hours clear. Friday afternoon adds 45–60 minutes through the Bay Bridge corridor:',
        bullets: [
          'Leave before 2:00pm — ahead of the outbound rush',
          'Leave after 7:00pm — arrive around 10:00pm',
        ],
      },
      'Before 2:00pm is the better option with kids in the car.',
      'No rental needed. Parking is included with unit 214, and the boardwalk is walkable from there.',
    ],
  },
  {
    id: 'activities',
    text: 'Plan activities and attractions suitable for families',
    status: 'active',
    variant: 'thread',
    detail: [
      {
        text: 'Looking for things that work across a six-year-old and an eleven-year-old over two days:',
        bullets: [
          'Cape Henlopen State Park — trails and a quieter beach, 10 minutes north',
          'Funland on the boardwalk — small-kid rides, cash only, opens at 1:00pm',
          'Dolphin watching cruise — 90 minutes, sails at 9:00am and 2:00pm',
        ],
      },
      'Saturday morning is the better window for the cruise. The afternoon sailing runs into the forecast high of 88°F, and the 9:00am leaves the rest of the day open.',
      'Still checking whether the state park charges out-of-state plates a day pass, and whether Funland',
    ],
  },
  {
    id: 'packing',
    text: 'Create packing list for beach trip essentials',
    status: 'todo',
  },
  {
    id: 'meals',
    text: 'Organize meals and restaurant reservations',
    status: 'todo',
  },
  {
    id: 'budget',
    text: 'Budget the trip and account for all expenses',
    status: 'todo',
  },
  {
    id: 'itinerary',
    text: 'Make final arrangements and create itinerary',
    status: 'todo',
  },
]

export const DONE_COUNT = ITEMS.filter((i) => i.status === 'done').length
