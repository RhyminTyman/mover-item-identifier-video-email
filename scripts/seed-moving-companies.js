const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// List of moving companies from the image
const companies = [
  "Al's Moving",
  "Art of Living Moving & Storage", 
  "Ben Hur Moving & Storage",
  "Big Apple Moving",
  "Big John's Moving",
  "Blue Moving",
  "Capital City Movers",
  "Capital City Moving",
  "Chelsea Moving",
  "City Moving",
  "Clancy Moving",
  "Clean Cut Moving",
  "College Educated Movers",
  "Cool Hand Movers",
  "Divine Moving",
  "Dumbo Moving",
  "Dynamic Movers NYC",
  "Dyno Moving",
  "Elate Moving",
  "Empire Movers",
  "Excellent Quality Movers",
  "Expedite Moving",
  "Expo Movers",
  "FlatRate Moving",
  "Fournier Moving",
  "Freeman's Moving",
  "Garrett's Moving",
  "Get There Moving",
  "Hall Lane Moving",
  "Harry's Moving",
  "Heart Moving",
  "iMove NYC",
  "Imperial Movers",
  "Intense Movers",
  "JP Urban Moving",
  "Konstantly Moving",
  "Lifestyle Moving & Storage",
  "Liffey Van Lines",
  "Lift NYC Movers",
  "Lightfoot Moving",
  "Man With A Van NYC",
  "Maxi Moving",
  "Mazel Tov Movers",
  "Men on the Move",
  "Metropolis Moving",
  "Moishe's Moving",
  "Moving Company Long Island",
  "Moving Right Along",
  "Movit Moving",
  "NY Minute Movers",
  "NYC Great Movers",
  "NYC Green Line Moving",
  "NYC Movers & Packers",
  "NYC Moves",
  "NYC Moving World",
  "Ocean Moving",
  "Orion Moving",
  "Otter Moving",
  "Oz Moving",
  "Perfect Moving",
  "Piece of Cake Moving",
  "Q's Moving",
  "Relo Moving & Storage",
  "Rhino Movers NYC",
  "Roadway Moving",
  "Scanio Moving",
  "Seka Moving & Storage",
  "Shleppers Moving",
  "Soho Moving",
  "Solid Moving NYC",
  "Solidarity Movers",
  "SOMA Movers",
  "Steel Moving",
  "Superb Moving",
  "Sven Moving",
  "TB Moving",
  "Teddy Moving and Storage",
  "Tri-State One Moving",
  "Upper East Movers",
  "Vector Movers",
  "Verrazano Moving",
  "White Glove Moving",
  "Zenith Moving",
  "ZeroMax Moving"
];

// NYC boroughs and areas for realistic addresses
const nycAreas = [
  { borough: "Manhattan", areas: ["Financial District", "SoHo", "Chelsea", "Upper East Side", "Upper West Side", "Midtown", "East Village", "West Village", "Tribeca", "Lower East Side"] },
  { borough: "Brooklyn", areas: ["Williamsburg", "Park Slope", "Dumbo", "Brooklyn Heights", "Red Hook", "Bay Ridge", "Sunset Park", "Crown Heights", "Prospect Heights"] },
  { borough: "Queens", areas: ["Astoria", "Long Island City", "Jackson Heights", "Flushing", "Forest Hills", "Elmhurst", "Woodside", "Sunnyside"] },
  { borough: "Bronx", areas: ["Fordham", "Pelham Bay", "Riverdale", "Mott Haven", "Concourse", "Highbridge"] },
  { borough: "Staten Island", areas: ["St. George", "New Brighton", "Tottenville", "Great Kills", "Eltingville"] }
];

// Generate realistic contact info for a company
function generateCompanyData(companyName, index) {
  const area = nycAreas[index % nycAreas.length];
  const subArea = area.areas[index % area.areas.length];
  
  // Generate street number and name
  const streetNumbers = [100, 200, 300, 400, 500, 600, 700, 800, 900, 1000, 1100, 1200, 1300, 1400, 1500];
  const streetNames = ["Main St", "Broadway", "Park Ave", "Lexington Ave", "Madison Ave", "5th Ave", "6th Ave", "7th Ave", "8th Ave", "9th Ave", "10th Ave", "1st St", "2nd St", "3rd St", "4th St", "Spring St", "Canal St", "Houston St", "14th St", "23rd St", "34th St", "42nd St", "57th St", "72nd St", "86th St", "96th St", "110th St"];
  
  const streetNumber = streetNumbers[index % streetNumbers.length];
  const streetName = streetNames[index % streetNames.length];
  
  // Generate phone number (NYC area codes: 212, 646, 917, 718, 347, 929)
  const areaCodes = ["212", "646", "917", "718", "347", "929"];
  const areaCode = areaCodes[index % areaCodes.length];
  const phoneNumber = `${areaCode}-${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`;
  
  // Generate email
  const emailDomains = ["gmail.com", "yahoo.com", "hotmail.com", "outlook.com", "aol.com"];
  const companyEmail = companyName.toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '')
    .substring(0, 15) + "@" + emailDomains[index % emailDomains.length];
  
  // Generate website
  const website = `www.${companyName.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '')}.com`;
  
  return {
    name: companyName,
    address: `${streetNumber} ${streetName}`,
    city: subArea,
    state: "NY",
    zipCode: `${10000 + (index % 100)}`,
    phone: phoneNumber,
    email: companyEmail,
    website: website,
    // Pricing settings with some variation
    baseCostPerHour: 45 + (index % 20), // $45-65/hour
    costPerMile: 1.5 + (index % 10) * 0.1, // $1.5-2.4/mile
    costPerCubicFoot: 0.4 + (index % 15) * 0.05, // $0.4-1.15/cubic foot
    costPerPound: 0.08 + (index % 12) * 0.01, // $0.08-0.19/pound
    stairCostPerFlight: 8 + (index % 15), // $8-22/flight
    packingCostPerBox: 4 + (index % 8), // $4-11/box
    unpackingCostPerBox: 2 + (index % 6), // $2-7/box
    disposalCost: 20 + (index % 20), // $20-39
    storageCostPerDay: 8 + (index % 12), // $8-19/day
    rushServiceMultiplier: 1.2 + (index % 8) * 0.1, // 1.2-1.9x
    taxRate: 6 + (index % 6) // 6-11%
  };
}

// Generate user data for company admin
function generateUserData(companyName, companyId, index) {
  const firstNames = ["John", "Sarah", "Mike", "Lisa", "David", "Jennifer", "Robert", "Maria", "James", "Patricia", "William", "Linda", "Richard", "Barbara", "Joseph", "Elizabeth", "Thomas", "Jessica", "Christopher", "Susan", "Daniel", "Nancy", "Mark", "Betty", "Paul", "Helen", "Steven", "Sandra", "Andrew", "Donna", "Joshua", "Carol", "Kenneth", "Ruth", "Kevin", "Sharon", "Brian", "Michelle", "George", "Laura"];
  const lastNames = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Martin", "Lee", "Perez", "Thompson", "White", "Harris", "Sanchez", "Clark", "Ramirez", "Lewis", "Robinson", "Walker", "Young", "Allen", "King", "Wright", "Scott", "Torres", "Nguyen", "Hill", "Flores"];
  
  const firstName = firstNames[index % firstNames.length];
  const lastName = lastNames[index % lastNames.length];
  
  // Generate unique email with timestamp and index
  const emailDomains = ["gmail.com", "yahoo.com", "hotmail.com", "outlook.com", "aol.com", "icloud.com"];
  const timestamp = Date.now();
  const userEmail = `${firstName.toLowerCase()}.${lastName.toLowerCase()}.${timestamp}.${index}@${emailDomains[index % emailDomains.length]}`;
  
  return {
    clerkId: `user_${timestamp}_${index}`,
    email: userEmail,
    firstName: firstName,
    lastName: lastName,
    role: "company-admin",
    isActive: true,
    onboarded: true,
    companyId: companyId
  };
}

async function seedCompanies() {
  console.log('🌱 Starting to seed moving companies...');
  
  try {
    // Clear existing companies and users (be careful in production!)
    console.log('🧹 Clearing existing data...');
    await prisma.user.deleteMany({
      where: {
        role: {
          in: ['company-admin', 'sales']
        }
      }
    });
    await prisma.company.deleteMany({});
    
    let createdCount = 0;
    
    for (let i = 0; i < companies.length; i++) {
      const companyName = companies[i];
      const companyData = generateCompanyData(companyName, i);
      
      try {
        // Create company
        const company = await prisma.company.create({
          data: companyData
        });
        
        console.log(`✅ Created company: ${company.name}`);
        
        // Create company admin user
        const userData = generateUserData(companyName, company.id, i);
        const user = await prisma.user.create({
          data: userData
        });
        
        console.log(`👤 Created admin user: ${user.firstName} ${user.lastName} (${user.email})`);
        
        // Create 1-3 sales users for each company
        const salesUserCount = 1 + (i % 3); // 1-3 sales users
        for (let j = 0; j < salesUserCount; j++) {
          const salesUserData = generateUserData(companyName, company.id, i * 10 + j + 10000);
          salesUserData.role = "sales";
          salesUserData.email = `sales${j + 1}.${companyName.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '')}.${Date.now()}.${i}.${j}@company.com`;
          
          const salesUser = await prisma.user.create({
            data: salesUserData
          });
          
          console.log(`👥 Created sales user: ${salesUser.firstName} ${salesUser.lastName} (${salesUser.email})`);
        }
        
        createdCount++;
        
      } catch (error) {
        console.error(`❌ Error creating company ${companyName}:`, error.message);
      }
    }
    
    console.log(`🎉 Successfully created ${createdCount} companies with users!`);
    
    // Print summary
    const totalCompanies = await prisma.company.count();
    const totalUsers = await prisma.user.count();
    const adminUsers = await prisma.user.count({ where: { role: 'company-admin' } });
    const salesUsers = await prisma.user.count({ where: { role: 'sales' } });
    
    console.log('\n📊 Summary:');
    console.log(`   Companies: ${totalCompanies}`);
    console.log(`   Total Users: ${totalUsers}`);
    console.log(`   Admin Users: ${adminUsers}`);
    console.log(`   Sales Users: ${salesUsers}`);
    
  } catch (error) {
    console.error('❌ Error seeding companies:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seed function
seedCompanies();
