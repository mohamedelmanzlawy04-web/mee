/**
 * Seed: Egypt governorates with shipping prices
 * Run: pnpm --filter @workspace/scripts run seed:gov
 */
import { db } from '../lib/db/src/index.ts';
import { governoratesTable, citiesTable } from '../lib/db/src/index.ts';
import { eq } from 'drizzle-orm';

const GOVERNORATES = [
  {
    name: 'Cairo', nameAr: 'القاهرة', shippingPrice: 60, estimatedDays: 2,
    cities: ['Nasr City', 'Heliopolis', 'Maadi', 'Zamalek', 'New Cairo', 'Downtown', 'Dokki', 'Mohandessin', '6th of October', 'Shubra'],
  },
  {
    name: 'Giza', nameAr: 'الجيزة', shippingPrice: 65, estimatedDays: 2,
    cities: ['Haram', 'Dokki', 'Imbaba', 'Bulaq Dakrur', 'Sheikh Zayed', '6th of October', 'Badrashin'],
  },
  {
    name: 'Alexandria', nameAr: 'الإسكندرية', shippingPrice: 75, estimatedDays: 3,
    cities: ['Smouha', 'Gleem', 'Montazah', 'Miami', 'Sidi Gaber', 'Stanley', 'Sporting', 'Agami'],
  },
  {
    name: 'Qalyubia', nameAr: 'القليوبية', shippingPrice: 70, estimatedDays: 3,
    cities: ['Banha', 'Shubra El Kheima', 'Qalyub', 'Khanka', 'Toukh'],
  },
  {
    name: 'Sharqia', nameAr: 'الشرقية', shippingPrice: 75, estimatedDays: 3,
    cities: ['Zagazig', '10th of Ramadan', 'Abu Kabir', 'Minya El Qamh', 'Belbeis'],
  },
  {
    name: 'Dakahlia', nameAr: 'الدقهلية', shippingPrice: 75, estimatedDays: 3,
    cities: ['Mansoura', 'Mit Ghamr', 'Talkha', 'Aga', 'Dekerness'],
  },
  {
    name: 'Beheira', nameAr: 'البحيرة', shippingPrice: 75, estimatedDays: 3,
    cities: ['Damanhur', 'Kafr El Dawwar', 'Abu Hummus', 'Rashid', 'Edku'],
  },
  {
    name: 'Gharbia', nameAr: 'الغربية', shippingPrice: 75, estimatedDays: 3,
    cities: ['Tanta', 'El Mahalla El Kubra', 'Kafr El Zayat', 'Zifta', 'Santa'],
  },
  {
    name: 'Menoufia', nameAr: 'المنوفية', shippingPrice: 75, estimatedDays: 3,
    cities: ['Shibin El Kom', 'Menouf', 'Sadat City', 'Ashmoun', 'Quesna'],
  },
  {
    name: 'Kafr El Sheikh', nameAr: 'كفر الشيخ', shippingPrice: 80, estimatedDays: 4,
    cities: ['Kafr El Sheikh', 'Desouk', 'Fuwwah', 'Sidi Salem'],
  },
  {
    name: 'Damietta', nameAr: 'دمياط', shippingPrice: 80, estimatedDays: 3,
    cities: ['Damietta', 'New Damietta', 'Kafr Saad', 'Faraskur'],
  },
  {
    name: 'Port Said', nameAr: 'بورسعيد', shippingPrice: 80, estimatedDays: 4,
    cities: ['Port Said', 'Port Fouad'],
  },
  {
    name: 'Ismailia', nameAr: 'الإسماعيلية', shippingPrice: 80, estimatedDays: 4,
    cities: ['Ismailia', 'Abu Atiwa', 'Fayed', 'Qantara'],
  },
  {
    name: 'Suez', nameAr: 'السويس', shippingPrice: 80, estimatedDays: 4,
    cities: ['Suez', 'Ain Sokhna'],
  },
  {
    name: 'North Sinai', nameAr: 'شمال سيناء', shippingPrice: 100, estimatedDays: 5,
    cities: ['Arish', 'Sheikh Zuweid', 'Rafah', 'Bir El Abd'],
  },
  {
    name: 'South Sinai', nameAr: 'جنوب سيناء', shippingPrice: 100, estimatedDays: 5,
    cities: ['Sharm El Sheikh', 'Dahab', 'Taba', 'Nuweiba', 'Saint Catherine'],
  },
  {
    name: 'Beni Suef', nameAr: 'بني سويف', shippingPrice: 85, estimatedDays: 4,
    cities: ['Beni Suef', 'Nasser', 'El Wasta', 'Ihnasya'],
  },
  {
    name: 'Faiyum', nameAr: 'الفيوم', shippingPrice: 85, estimatedDays: 4,
    cities: ['Fayoum', 'Ibsheway', 'Sinnuris', 'Yusuf El Siddiq'],
  },
  {
    name: 'Minya', nameAr: 'المنيا', shippingPrice: 90, estimatedDays: 4,
    cities: ['Minya', 'Mallawi', 'Abu Qurqas', 'Beni Mazar', 'Matay'],
  },
  {
    name: 'Asyut', nameAr: 'أسيوط', shippingPrice: 90, estimatedDays: 4,
    cities: ['Asyut', 'Abnub', 'Manfalut', 'El Qusiya', 'Dayrout'],
  },
  {
    name: 'Sohag', nameAr: 'سوهاج', shippingPrice: 95, estimatedDays: 5,
    cities: ['Sohag', 'Akhmim', 'Girga', 'Tahta', 'Juhayna'],
  },
  {
    name: 'Qena', nameAr: 'قنا', shippingPrice: 95, estimatedDays: 5,
    cities: ['Qena', 'Luxor', 'Nag Hammadi', 'Qus', 'Dishna'],
  },
  {
    name: 'Luxor', nameAr: 'الأقصر', shippingPrice: 100, estimatedDays: 5,
    cities: ['Luxor', 'Armant', 'Esna', 'El Tod'],
  },
  {
    name: 'Aswan', nameAr: 'أسوان', shippingPrice: 100, estimatedDays: 5,
    cities: ['Aswan', 'Edfu', 'Kom Ombo', 'Abu Simbel', 'Nasr El Nuba'],
  },
  {
    name: 'Red Sea', nameAr: 'البحر الأحمر', shippingPrice: 100, estimatedDays: 5,
    cities: ['Hurghada', 'Safaga', 'El Quseir', 'Marsa Alam'],
  },
  {
    name: 'Matrouh', nameAr: 'مطروح', shippingPrice: 100, estimatedDays: 6,
    cities: ['Marsa Matrouh', 'Siwa', 'El Alamein', 'Sallum'],
  },
  {
    name: 'New Valley', nameAr: 'الوادي الجديد', shippingPrice: 110, estimatedDays: 6,
    cities: ['Kharga', 'Dakhla', 'Farafra', 'Paris'],
  },
];

async function main() {
  console.log('⏳ Seeding Egypt governorates…');
  let created = 0;
  let skipped = 0;

  for (const GOV of GOVERNORATES) {
    const [existing] = await db
      .select({ id: governoratesTable.id })
      .from(governoratesTable)
      .where(eq(governoratesTable.name, GOV.name))
      .limit(1);

    let govId: string;
    if (existing) {
      govId = existing.id;
      skipped++;
    } else {
      const [gov] = await db
        .insert(governoratesTable)
        .values({
          name: GOV.name,
          nameAr: GOV.nameAr,
          shippingPrice: String(GOV.shippingPrice),
          estimatedDays: GOV.estimatedDays,
          isActive: true,
        })
        .returning();
      govId = gov.id;
      created++;
    }

    // Seed cities
    for (const cityName of GOV.cities) {
      const [existingCity] = await db
        .select({ id: citiesTable.id })
        .from(citiesTable)
        .where(eq(citiesTable.governorateId, govId))
        .limit(1);

      if (!existingCity) {
        for (const cn of GOV.cities) {
          try {
            await db.insert(citiesTable).values({ governorateId: govId, name: cn }).onConflictDoNothing();
          } catch {}
        }
        break;
      }
    }
  }

  console.log(`✅ Done — ${created} created, ${skipped} already existed.`);
  process.exit(0);
}

main().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
