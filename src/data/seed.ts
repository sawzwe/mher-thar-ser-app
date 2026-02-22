import { Restaurant, DayHours } from "@/types";

function weeklyHours(
  weekday: { open: string; close: string }[],
  weekend: { open: string; close: string }[],
  overrides?: Partial<Record<string, { open: string; close: string }[] | "closed">>
): DayHours[] {
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  return days.map((day) => {
    if (overrides?.[day] === "closed") return { day, intervals: [], closed: true };
    if (overrides?.[day]) return { day, intervals: overrides[day] as { open: string; close: string }[] };
    const isWeekend = day === "Saturday" || day === "Sunday";
    return { day, intervals: isWeekend ? weekend : weekday };
  });
}

export const restaurants: Restaurant[] = [
  {
    id: "r1",
    name: "Saffron Thai",
    description:
      "Authentic Thai cuisine in a cozy setting with handcrafted cocktails and traditional recipes passed down through generations.",
    area: "Sukhumvit",
    address: "123 Sukhumvit Soi 31, Khlong Toei Nuea, Watthana, Bangkok 10110",
    geo: { lat: 13.7366, lng: 100.5686 },
    transitNearby: [
      { name: "Phrom Phong", type: "BTS", walkingMinutes: 5 },
      { name: "Sukhumvit", type: "MRT", walkingMinutes: 10 },
    ],
    cuisineTags: ["Thai", "Asian"],
    priceTier: 2,
    rating: 4.6,
    reviewCount: 324,
    imageUrl: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&auto=format&fit=crop&q=80",
    deals: [
      { id: "d1", title: "Lunch Set Menu", type: "set_menu", description: "Starter + Main + Dessert", price: 450, conditions: "Mon-Fri 11:00-14:00" },
      { id: "d2", title: "20% Off Dinner", type: "discount", description: "20% off total bill for dinner", discount: 20, conditions: "Min 2 guests, Sun-Thu only" },
    ],
    menu: [
      { name: "Appetizers", items: [
        { name: "Tom Yum Goong", description: "Spicy prawn soup with lemongrass", price: 220 },
        { name: "Satay Gai", description: "Grilled chicken skewers with peanut sauce", price: 180 },
      ]},
      { name: "Mains", items: [
        { name: "Pad Thai Goong", description: "Stir-fried rice noodles with prawns", price: 280 },
        { name: "Gaeng Keow Wan", description: "Green curry with chicken and Thai basil", price: 260 },
        { name: "Khao Pad Sapparod", description: "Pineapple fried rice in pineapple shell", price: 250 },
      ]},
      { name: "Desserts", items: [
        { name: "Mango Sticky Rice", description: "Fresh mango with coconut sticky rice", price: 180 },
      ]},
    ],
    openingHours: weeklyHours(
      [{ open: "11:00", close: "22:00" }],
      [{ open: "10:00", close: "22:30" }]
    ),
    openTime: "11:00",
    closeTime: "22:00",
  },
  {
    id: "r2",
    name: "La Piazza",
    description:
      "Wood-fired pizzas and homemade pasta in an elegant Italian trattoria with an extensive wine list.",
    area: "Silom",
    address: "45 Silom Soi 19, Suriyawong, Bang Rak, Bangkok 10500",
    geo: { lat: 13.7262, lng: 100.5309 },
    transitNearby: [
      { name: "Chong Nonsi", type: "BTS", walkingMinutes: 4 },
      { name: "Sam Yan", type: "MRT", walkingMinutes: 12 },
    ],
    cuisineTags: ["Italian", "European"],
    priceTier: 3,
    rating: 4.8,
    reviewCount: 512,
    imageUrl: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&auto=format&fit=crop&q=80",
    deals: [
      { id: "d3", title: "Pizza & Pasta Buffet", type: "buffet", description: "Unlimited pizza and pasta selection", price: 890, conditions: "Available daily 12:00-15:00" },
    ],
    menu: [
      { name: "Antipasti", items: [
        { name: "Bruschetta al Pomodoro", description: "Toasted bread with tomato and basil", price: 220 },
        { name: "Burrata e Prosciutto", description: "Fresh burrata with parma ham", price: 420 },
      ]},
      { name: "Pizza", items: [
        { name: "Margherita DOC", description: "San Marzano, mozzarella di bufala, basil", price: 380 },
        { name: "Diavola", description: "Spicy salami, chili, mozzarella", price: 420 },
      ]},
      { name: "Pasta", items: [
        { name: "Spaghetti Carbonara", description: "Guanciale, egg yolk, pecorino", price: 390 },
        { name: "Pappardelle al Ragu", description: "Slow-braised beef ragu", price: 450 },
      ]},
    ],
    openingHours: weeklyHours(
      [{ open: "12:00", close: "23:00" }],
      [{ open: "11:30", close: "23:30" }]
    ),
    openTime: "12:00",
    closeTime: "23:00",
  },
  {
    id: "r3",
    name: "Sakura Garden",
    description:
      "Premium Japanese dining featuring fresh sashimi, hand-rolled sushi, and seasonal omakase experiences.",
    area: "Thonglor",
    address: "88 Thonglor Soi 13, Khlong Tan Nuea, Watthana, Bangkok 10110",
    geo: { lat: 13.7326, lng: 100.5835 },
    transitNearby: [
      { name: "Thong Lo", type: "BTS", walkingMinutes: 8 },
    ],
    cuisineTags: ["Japanese", "Asian"],
    priceTier: 4,
    rating: 4.9,
    reviewCount: 198,
    imageUrl: "https://images.unsplash.com/photo-1563245372-f21724e3856d?w=600&auto=format&fit=crop&q=80",
    deals: [
      { id: "d4", title: "Omakase Special", type: "set_menu", description: "8-course chef's selection", price: 2800, conditions: "Reservation required 24h ahead" },
      { id: "d5", title: "Free Sake", type: "free_item", description: "Complimentary bottle of sake for tables of 4+", conditions: "Dinner only, while stocks last" },
    ],
    menu: [
      { name: "Sashimi", items: [
        { name: "Salmon Sashimi", description: "5 pieces of fresh Norwegian salmon", price: 380 },
        { name: "Toro Sashimi", description: "3 pieces of fatty tuna belly", price: 680 },
      ]},
      { name: "Sushi", items: [
        { name: "Chef's Nigiri Set", description: "8-piece seasonal nigiri", price: 780 },
        { name: "Dragon Roll", description: "Eel, avocado, tobiko", price: 480 },
      ]},
      { name: "Hot Dishes", items: [
        { name: "Black Cod Miso", description: "72-hour marinated black cod", price: 890 },
        { name: "Wagyu Tataki", description: "A5 wagyu beef tataki with ponzu", price: 980 },
      ]},
    ],
    openingHours: weeklyHours(
      [{ open: "17:00", close: "23:00" }],
      [{ open: "12:00", close: "15:00" }, { open: "17:00", close: "23:00" }],
      { Monday: "closed" }
    ),
    openTime: "17:00",
    closeTime: "23:00",
  },
  {
    id: "r4",
    name: "Burger Republic",
    description:
      "Gourmet burgers with locally sourced beef, craft beers on tap, and a lively sports bar atmosphere.",
    area: "Siam",
    address: "Siam Square One, 388 Rama 1 Rd, Pathum Wan, Bangkok 10330",
    geo: { lat: 13.7454, lng: 100.5345 },
    transitNearby: [
      { name: "Siam", type: "BTS", walkingMinutes: 2 },
    ],
    cuisineTags: ["American", "Burgers"],
    priceTier: 1,
    rating: 4.3,
    reviewCount: 876,
    imageUrl: "https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=600&auto=format&fit=crop&q=80",
    deals: [
      { id: "d6", title: "Burger + Beer Combo", type: "combo", description: "Any burger + craft beer", price: 350, conditions: "All day, dine-in only" },
      { id: "d7", title: "Happy Hour 50% Off Drinks", type: "discount", description: "Half price on all drinks", discount: 50, conditions: "Mon-Fri 16:00-18:00" },
    ],
    menu: [
      { name: "Burgers", items: [
        { name: "Classic Republic", description: "Angus patty, cheddar, lettuce, tomato", price: 290 },
        { name: "Truffle Smash", description: "Double smash patty with truffle aioli", price: 380 },
        { name: "BBQ Bacon Beast", description: "Bacon, onion rings, BBQ sauce", price: 350 },
      ]},
      { name: "Sides", items: [
        { name: "Loaded Fries", description: "Cheese sauce, jalapeños, bacon bits", price: 180 },
        { name: "Onion Rings", description: "Beer-battered crispy rings", price: 150 },
      ]},
      { name: "Drinks", items: [
        { name: "Craft IPA", description: "Rotating local craft beer", price: 220 },
      ]},
    ],
    openingHours: weeklyHours(
      [{ open: "11:00", close: "00:00" }],
      [{ open: "10:00", close: "01:00" }]
    ),
    openTime: "11:00",
    closeTime: "00:00",
  },
  {
    id: "r5",
    name: "Spice Route",
    description:
      "Bold Indian flavors from tandoori to biryani, served in a vibrant space with live sitar music on weekends.",
    area: "Sukhumvit",
    address: "22 Sukhumvit Soi 11, Khlong Toei Nuea, Watthana, Bangkok 10110",
    geo: { lat: 13.7423, lng: 100.5546 },
    transitNearby: [
      { name: "Nana", type: "BTS", walkingMinutes: 3 },
      { name: "Sukhumvit", type: "MRT", walkingMinutes: 8 },
    ],
    cuisineTags: ["Indian", "Asian"],
    priceTier: 2,
    rating: 4.5,
    reviewCount: 267,
    imageUrl: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&auto=format&fit=crop&q=80",
    deals: [
      { id: "d8", title: "Thali Lunch Special", type: "set_menu", description: "Traditional thali with 6 dishes + naan + dessert", price: 380, conditions: "Weekdays 11:30-14:30" },
    ],
    menu: [
      { name: "Tandoori", items: [
        { name: "Tandoori Chicken", description: "Yogurt-marinated whole leg, charcoal grilled", price: 320 },
        { name: "Seekh Kebab", description: "Spiced lamb mince skewers", price: 280 },
      ]},
      { name: "Curries", items: [
        { name: "Butter Chicken", description: "Creamy tomato sauce, tender chicken tikka", price: 340 },
        { name: "Lamb Rogan Josh", description: "Slow-cooked lamb in Kashmiri chili sauce", price: 380 },
      ]},
      { name: "Breads & Rice", items: [
        { name: "Garlic Naan", price: 80 },
        { name: "Hyderabadi Biryani", description: "Fragrant basmati rice with chicken", price: 320 },
      ]},
    ],
    openingHours: weeklyHours(
      [{ open: "11:30", close: "22:30" }],
      [{ open: "11:00", close: "23:00" }]
    ),
    openTime: "11:30",
    closeTime: "22:30",
  },
  {
    id: "r6",
    name: "Dragon Palace",
    description:
      "Cantonese dim sum and Sichuan specialties in a grand dining hall with private rooms available.",
    area: "Chinatown",
    address: "156 Yaowarat Road, Samphanthawong, Bangkok 10100",
    geo: { lat: 13.7396, lng: 100.5095 },
    transitNearby: [
      { name: "Wat Mangkon", type: "MRT", walkingMinutes: 3 },
      { name: "Hua Lamphong", type: "MRT", walkingMinutes: 10 },
    ],
    cuisineTags: ["Chinese", "Asian"],
    priceTier: 2,
    rating: 4.4,
    reviewCount: 445,
    imageUrl: "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=600&auto=format&fit=crop&q=80",
    deals: [
      { id: "d9", title: "Dim Sum All You Can Eat", type: "buffet", description: "Unlimited dim sum selection with 40+ items", price: 599, conditions: "Sat-Sun 10:00-14:00" },
      { id: "d10", title: "Family Feast", type: "set_menu", description: "5-course meal for 4 people", price: 1800, conditions: "Must book for 4+ guests" },
    ],
    menu: [
      { name: "Dim Sum", items: [
        { name: "Har Gow", description: "Crystal prawn dumplings (4 pcs)", price: 160 },
        { name: "Siu Mai", description: "Pork and prawn dumplings (4 pcs)", price: 140 },
        { name: "Char Siu Bao", description: "BBQ pork buns (3 pcs)", price: 120 },
      ]},
      { name: "Mains", items: [
        { name: "Peking Duck", description: "Whole roasted duck with pancakes", price: 1200 },
        { name: "Mapo Tofu", description: "Sichuan-style spicy tofu", price: 220 },
      ]},
      { name: "Noodles", items: [
        { name: "Wonton Noodle Soup", description: "Egg noodles with prawn wontons", price: 180 },
      ]},
    ],
    openingHours: weeklyHours(
      [{ open: "10:00", close: "22:00" }],
      [{ open: "09:00", close: "22:30" }]
    ),
    openTime: "10:00",
    closeTime: "22:00",
  },
  {
    id: "r7",
    name: "Seoul Kitchen",
    description:
      "Modern Korean BBQ with premium cuts, banchan spreads, and soju cocktails in a sleek setting.",
    area: "Thonglor",
    address: "55 Thonglor Soi 10, Khlong Tan Nuea, Watthana, Bangkok 10110",
    geo: { lat: 13.7299, lng: 100.5792 },
    transitNearby: [
      { name: "Thong Lo", type: "BTS", walkingMinutes: 6 },
      { name: "Ekkamai", type: "BTS", walkingMinutes: 12 },
    ],
    cuisineTags: ["Korean", "Asian", "BBQ"],
    priceTier: 3,
    rating: 4.7,
    reviewCount: 389,
    imageUrl: "https://images.unsplash.com/photo-1550547660-d9450f859349?w=600&auto=format&fit=crop&q=80",
    deals: [
      { id: "d11", title: "BBQ Combo for 2", type: "combo", description: "Premium beef set + sides + 2 drinks", price: 1290, conditions: "Available daily" },
    ],
    menu: [
      { name: "BBQ", items: [
        { name: "Chadol Baegi", description: "Thinly sliced beef brisket", price: 380 },
        { name: "Samgyeopsal", description: "Thick-cut pork belly", price: 320 },
        { name: "Galbi", description: "Marinated short ribs", price: 520 },
      ]},
      { name: "Korean Classics", items: [
        { name: "Kimchi Jjigae", description: "Fermented kimchi stew with pork", price: 260 },
        { name: "Bibimbap", description: "Mixed rice bowl with vegetables and egg", price: 280 },
      ]},
      { name: "Drinks", items: [
        { name: "Soju Cocktail", description: "Peach / Grape / Yogurt", price: 220 },
      ]},
    ],
    openingHours: weeklyHours(
      [{ open: "11:00", close: "23:00" }],
      [{ open: "11:00", close: "00:00" }]
    ),
    openTime: "11:00",
    closeTime: "23:00",
  },
  {
    id: "r8",
    name: "Le Petit Bistro",
    description:
      "Classic French bistro fare with seasonal menus, fine wines, and an intimate candlelit ambiance.",
    area: "Silom",
    address: "78 Pan Road, Silom, Bang Rak, Bangkok 10500",
    geo: { lat: 13.7249, lng: 100.5275 },
    transitNearby: [
      { name: "Surasak", type: "BTS", walkingMinutes: 5 },
      { name: "Si Lom", type: "MRT", walkingMinutes: 7 },
    ],
    cuisineTags: ["French", "European"],
    priceTier: 4,
    rating: 4.8,
    reviewCount: 156,
    imageUrl: "https://images.unsplash.com/photo-1533777857889-4be7c70b33f7?w=600&auto=format&fit=crop&q=80",
    deals: [
      { id: "d12", title: "3-Course Prix Fixe", type: "set_menu", description: "Amuse-bouche + Main + Dessert with wine pairing", price: 2200, conditions: "Dinner only, Tue-Sat" },
    ],
    menu: [
      { name: "Entrées", items: [
        { name: "Soupe à l'Oignon", description: "Classic French onion soup gratiné", price: 320 },
        { name: "Tartare de Boeuf", description: "Hand-cut beef tartare with quail egg", price: 480 },
      ]},
      { name: "Plats Principaux", items: [
        { name: "Confit de Canard", description: "Duck leg confit with pommes sarladaises", price: 680 },
        { name: "Bouillabaisse", description: "Provençal seafood stew with rouille", price: 780 },
      ]},
      { name: "Desserts", items: [
        { name: "Crème Brûlée", description: "Madagascar vanilla custard", price: 280 },
        { name: "Tarte Tatin", description: "Caramelised apple tart with crème fraîche", price: 320 },
      ]},
    ],
    openingHours: weeklyHours(
      [{ open: "18:00", close: "23:00" }],
      [{ open: "18:00", close: "23:30" }],
      { Monday: "closed" }
    ),
    openTime: "18:00",
    closeTime: "23:00",
  },
  {
    id: "r9",
    name: "Taco Loco",
    description:
      "Vibrant Mexican cantina with authentic tacos, fresh guacamole, and margaritas made with house-infused tequila.",
    area: "Siam",
    address: "Siam Discovery, 989 Rama 1 Rd, Pathum Wan, Bangkok 10330",
    geo: { lat: 13.7466, lng: 100.5316 },
    transitNearby: [
      { name: "Siam", type: "BTS", walkingMinutes: 3 },
      { name: "National Stadium", type: "BTS", walkingMinutes: 7 },
    ],
    cuisineTags: ["Mexican", "Latin"],
    priceTier: 1,
    rating: 4.2,
    reviewCount: 543,
    imageUrl: "https://images.unsplash.com/photo-1559339352-11d035aa65de?w=600&auto=format&fit=crop&q=80",
    deals: [
      { id: "d13", title: "Taco Tuesday", type: "discount", description: "Buy 2 get 1 free on all tacos", conditions: "Every Tuesday, all day" },
      { id: "d14", title: "Fiesta Platter", type: "combo", description: "Nachos + 4 tacos + salsa trio + 2 margaritas", price: 699, conditions: "Groups of 2+" },
    ],
    menu: [
      { name: "Tacos", items: [
        { name: "Al Pastor", description: "Spit-roasted pork, pineapple, cilantro", price: 120 },
        { name: "Carnitas", description: "Slow-cooked pulled pork", price: 120 },
        { name: "Baja Fish", description: "Beer-battered fish, chipotle mayo, slaw", price: 140 },
      ]},
      { name: "Sides & Shares", items: [
        { name: "Guacamole & Chips", description: "Made fresh tableside", price: 220 },
        { name: "Elote", description: "Grilled corn with mayo, chili, lime", price: 120 },
      ]},
      { name: "Drinks", items: [
        { name: "Margarita Clásica", description: "Tequila, lime, agave, salt rim", price: 250 },
      ]},
    ],
    openingHours: weeklyHours(
      [{ open: "11:00", close: "00:00" }],
      [{ open: "10:00", close: "01:00" }]
    ),
    openTime: "11:00",
    closeTime: "00:00",
  },
  {
    id: "r10",
    name: "The Seafood Market",
    description:
      "Pick your fresh catch from the market display and have it cooked your way — grilled, steamed, or fried.",
    area: "Riverside",
    address: "306 Charoen Krung Rd, Khwaeng Si Phraya, Bang Rak, Bangkok 10500",
    geo: { lat: 13.7216, lng: 100.5156 },
    transitNearby: [
      { name: "Saphan Taksin", type: "BTS", walkingMinutes: 10 },
    ],
    cuisineTags: ["Seafood", "Thai"],
    priceTier: 3,
    rating: 4.6,
    reviewCount: 621,
    imageUrl: "https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?w=600&auto=format&fit=crop&q=80",
    deals: [
      { id: "d15", title: "Sunset Seafood Platter", type: "set_menu", description: "Mixed platter for 2 with river view seating", price: 1590, conditions: "17:00-19:00 daily" },
    ],
    menu: [
      { name: "Market Fresh", items: [
        { name: "Grilled River Prawns", description: "Charcoal-grilled giant prawns (per 100g)", price: 350 },
        { name: "Steamed Sea Bass", description: "Whole fish with lime and chili", price: 480 },
      ]},
      { name: "Stir-Fry", items: [
        { name: "Pad Cha Clam", description: "Clams stir-fried with Thai herbs", price: 320 },
        { name: "Crab Curry", description: "Blue crab in yellow curry", price: 420 },
      ]},
      { name: "Soups", items: [
        { name: "Tom Kha Talay", description: "Coconut seafood soup", price: 280 },
        { name: "Pla Rad Prik", description: "Crispy fish with chili sauce", price: 380 },
      ]},
    ],
    openingHours: weeklyHours(
      [{ open: "11:00", close: "22:00" }],
      [{ open: "10:30", close: "22:30" }]
    ),
    openTime: "11:00",
    closeTime: "22:00",
  },
  {
    id: "r11",
    name: "Green Bowl",
    description:
      "Plant-based dining with creative dishes that even meat lovers adore. Organic ingredients, zero compromise on flavor.",
    area: "Ari",
    address: "12 Phahonyothin Soi 7, Samsen Nai, Phaya Thai, Bangkok 10400",
    geo: { lat: 13.7797, lng: 100.5444 },
    transitNearby: [
      { name: "Ari", type: "BTS", walkingMinutes: 4 },
    ],
    cuisineTags: ["Vegetarian", "Healthy", "Asian"],
    priceTier: 2,
    rating: 4.4,
    reviewCount: 178,
    imageUrl: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&auto=format&fit=crop&q=80",
    deals: [
      { id: "d16", title: "Detox Lunch Set", type: "set_menu", description: "Cold-pressed juice + Buddha bowl + raw dessert", price: 420, conditions: "Mon-Fri 11:00-14:00" },
      { id: "d17", title: "15% Off First Visit", type: "discount", description: "New customer welcome discount", discount: 15, conditions: "Show this deal at checkout" },
    ],
    menu: [
      { name: "Bowls", items: [
        { name: "Buddha Bowl", description: "Quinoa, roasted veg, tahini dressing", price: 280 },
        { name: "Poke Bowl", description: "Marinated tofu, edamame, avocado, brown rice", price: 300 },
      ]},
      { name: "Mains", items: [
        { name: "Mushroom Steak", description: "King oyster mushroom with chimichurri", price: 320 },
        { name: "Pad Thai Jay", description: "Vegan pad thai with tofu", price: 220 },
      ]},
      { name: "Juices & Smoothies", items: [
        { name: "Green Detox", description: "Kale, apple, ginger, lemon", price: 160 },
        { name: "Acai Smoothie Bowl", description: "Acai, banana, granola, berries", price: 220 },
      ]},
    ],
    openingHours: weeklyHours(
      [{ open: "09:00", close: "21:00" }],
      [{ open: "08:00", close: "21:00" }]
    ),
    openTime: "09:00",
    closeTime: "21:00",
  },
  {
    id: "r12",
    name: "Naan & Curry House",
    description:
      "Family-run Northern Indian restaurant famous for its butter chicken, garlic naan, and warm hospitality.",
    area: "Ari",
    address: "9 Phahonyothin Soi 5, Samsen Nai, Phaya Thai, Bangkok 10400",
    geo: { lat: 13.7789, lng: 100.5421 },
    transitNearby: [
      { name: "Ari", type: "BTS", walkingMinutes: 6 },
      { name: "Saphan Khwai", type: "BTS", walkingMinutes: 9 },
    ],
    cuisineTags: ["Indian", "Asian"],
    priceTier: 1,
    rating: 4.5,
    reviewCount: 892,
    imageUrl: "https://images.unsplash.com/photo-1569050467447-ce54b3bbc37d?w=600&auto=format&fit=crop&q=80",
    deals: [
      { id: "d18", title: "Weekday Lunch Buffet", type: "buffet", description: "All-you-can-eat lunch buffet with 15+ dishes", price: 299, conditions: "Mon-Fri 11:00-14:30" },
      { id: "d19", title: "Couple's Dinner", type: "set_menu", description: "2 curries + rice + naan + dessert for 2", price: 650, conditions: "Dinner, party of 2 only" },
    ],
    menu: [
      { name: "Curries", items: [
        { name: "Butter Chicken", description: "Signature creamy tomato chicken curry", price: 240 },
        { name: "Dal Makhani", description: "Black lentils slow-cooked overnight", price: 180 },
        { name: "Palak Paneer", description: "Spinach with Indian cottage cheese", price: 200 },
      ]},
      { name: "Breads", items: [
        { name: "Garlic Naan", price: 60 },
        { name: "Cheese Naan", description: "Stuffed with mozzarella", price: 90 },
      ]},
      { name: "Desserts", items: [
        { name: "Gulab Jamun", description: "Fried milk dumplings in rose syrup", price: 120 },
      ]},
    ],
    openingHours: weeklyHours(
      [{ open: "11:00", close: "22:00" }],
      [{ open: "10:00", close: "22:30" }]
    ),
    openTime: "11:00",
    closeTime: "22:00",
  },
];

export const AREAS = [
  "Sukhumvit",
  "Silom",
  "Thonglor",
  "Siam",
  "Chinatown",
  "Riverside",
  "Ari",
];

export const CUISINES = [
  "Thai",
  "Italian",
  "Japanese",
  "American",
  "Indian",
  "Chinese",
  "Korean",
  "French",
  "Mexican",
  "Seafood",
  "Vegetarian",
  "European",
  "Asian",
  "BBQ",
  "Burgers",
  "Healthy",
  "Latin",
];
