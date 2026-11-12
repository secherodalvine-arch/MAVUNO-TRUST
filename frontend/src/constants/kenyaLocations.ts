/**
 * Comprehensive Kenya Administrative Geographic Reference
 * Counties, Sub-Counties, and Wards / General Areas
 */

export interface SubCountyData {
  name: string;
  wards: string[];
}

export interface CountyData {
  county: string;
  subCounties: SubCountyData[];
}

export const KENYA_LOCATIONS: Record<string, SubCountyData[]> = {
  'Kiambu': [
    { name: 'Ruiru', wards: ['Biashara', 'Gitothua', 'Kahawa Sukari', 'Kahawa Wendani', 'Kiuu', 'Mwiki', 'Mwihoko'] },
    { name: 'Thika Town', wards: ['Township', 'Kamenu', 'Hospital', 'Gatuanyaga', 'Ngoliba'] },
    { name: 'Juja', wards: ['Murera', 'Theta', 'Juja', 'Witeithie', 'Kalimoni'] },
    { name: 'Kiambu Town', wards: ['Ting\'ang\'a', 'Ndumberi', 'Riabai', 'Township'] },
    { name: 'Limuru', wards: ['Bibirioni', 'Limuru Central', 'Ndeiya', 'Ngecha Tigoni', 'Limuru East'] },
    { name: 'Kikuyu', wards: ['Karai', 'Nachu', 'Sigona', 'Kikuyu', 'Kinoo'] },
    { name: 'Kabete', wards: ['Gitaru', 'Muguga', 'Nyadhuna', 'Kabete', 'Uthiru'] },
    { name: 'Githunguri', wards: ['Githunguri', 'Githiga', 'Ikinu', 'Ngewa', 'Komothai'] },
    { name: 'Gatundu South', wards: ['Kiamwangi', 'Kiganjo', 'Ndarugu', 'Ng\'enda'] },
    { name: 'Gatundu North', wards: ['Gituamba', 'Githobokoni', 'Chania', 'Mang\'u'] },
    { name: 'Lari', wards: ['Kinale', 'Kijabe', 'Nyanduma', 'Kamburu', 'Lari Scheme'] },
  ],
  'Nakuru': [
    { name: 'Njoro', wards: ['Njoro', 'Mau Narok', 'Mauche', 'Kihingo', 'Nesuit', 'Lare'] },
    { name: 'Nakuru Town East', wards: ['Biashara', 'Kivumbini', 'Flamingo', 'Menengai', 'Nakuru East'] },
    { name: 'Nakuru Town West', wards: ['Barut', 'London', 'Kaptembwo', 'Kapkures', 'Rhoda', 'Shaabab'] },
    { name: 'Rongai', wards: ['Menengai West', 'Soin', 'Visoi', 'Mosop', 'Solai'] },
    { name: 'Naivasha', wards: ['Biashara', 'Hells Gate', 'Lake View', 'Mai Mahiu', 'Olkaria', 'Naivasha East', 'Viwandani'] },
    { name: 'Gilgil', wards: ['Gilgil', 'Elembiita', 'Kariandusi', 'Murindat', 'Malewa West'] },
    { name: 'Subukia', wards: ['Subukia', 'Waseges', 'Kabazi'] },
    { name: 'Bahati', wards: ['Dundori', 'Kabatini', 'Kiamaina', 'Lanet Umoja', 'Bahati'] },
    { name: 'Molo', wards: ['Mariashoni', 'Elburgon', 'Turi', 'Molo'] },
    { name: 'Kuresoi North', wards: ['Kiptororo', 'Nyota', 'Sirikwa', 'Kamara'] },
    { name: 'Kuresoi South', wards: ['Amalo', 'Keringet', 'Kiptagich', 'Tinet'] },
  ],
  'Nairobi': [
    { name: 'Westlands', wards: ['Kitisuru', 'Parklands/Highridge', 'Karura', 'Kangemi', 'Mountain View'] },
    { name: 'Dagoretti North', wards: ['Kilimani', 'Kawangware', 'Gatina', 'Kileleshwa', 'Kabiro'] },
    { name: 'Dagoretti South', wards: ['Mutu-ini', 'Ng\'ando', 'Riruta', 'Uthiru/Ruthimitu', 'Waithaka'] },
    { name: 'Lang\'ata', wards: ['Karen', 'Nairobi West', 'Mugumo-ini', 'South C', 'Nyayo Highrise'] },
    { name: 'Kibra', wards: ['Laini Saba', 'Lindi', 'Makina', 'Woodley/Kenyatta Golf Course', 'Sarang\'ombe'] },
    { name: 'Roysambu', wards: ['Githurai', 'Kahawa West', 'Zimmerman', 'Roysambu', 'Kahawa'] },
    { name: 'Kasarani', wards: ['Clay City', 'Mwiki', 'Kasarani', 'Njiru', 'Ruai'] },
    { name: 'Ruaraka', wards: ['Babadogo', 'Utalii', 'Mathare North', 'Lucky Summer', 'Korogocho'] },
    { name: 'Embakasi South', wards: ['Imara Daima', 'Kwa Njenga', 'Kwa Reuben', 'Pipeline', 'Kware'] },
    { name: 'Embakasi North', wards: ['Kariobangi North', 'Dandora Area I', 'Dandora Area II', 'Dandora Area III', 'Dandora Area IV'] },
    { name: 'Embakasi Central', wards: ['Kayole North', 'Kayole Central', 'Kayole South', 'Komarock', 'Matopeni/Spring Valley'] },
    { name: 'Embakasi East', wards: ['Upper Savanna', 'Lower Savanna', 'Embakasi', 'Utawala', 'Mihang\'o'] },
    { name: 'Embakasi West', wards: ['Umoja I', 'Umoja II', 'Mowlem', 'Kariobangi South'] },
    { name: 'Makadara', wards: ['Maringo/Hamza', 'Viwandani', 'Harambee', 'Makongeni'] },
    { name: 'Kamukunji', wards: ['Pumwani', 'Eastleigh North', 'Eastleigh South', 'Airbase', 'California'] },
    { name: 'Starehe', wards: ['Nairobi Central', 'Ngara', 'Pangani', 'Ziwani/Kariokor', 'Landi Mawe', 'Nairobi South'] },
    { name: 'Mathare', wards: ['Hospital', 'Mabatini', 'Huruma', 'Ngei', 'Mlango Kubwa', 'Kiamaiko'] },
  ],
  'Uasin Gishu': [
    { name: 'Ainabkoi', wards: ['Kapsoya', 'Kaptagat', 'Ainabkoi/Olare'] },
    { name: 'Kapseret', wards: ['Simat/Kapseret', 'Kipkenyo', 'Ngeria', 'Megun', 'Langas'] },
    { name: 'Kesses', wards: ['Racecourse', 'Cheptiret/Kipchamo', 'Tulwet/Chuiyat', 'Tarakwa'] },
    { name: 'Moiben', wards: ['Temelio', 'Sergoit', 'Karuna/Meibeki', 'Moiben', 'Kimumu'] },
    { name: 'Soy', wards: ['Moi\'s Bridge', 'Kapkures', 'Ziwa', 'Segero/Barsombe', 'Kipsomba', 'Soy', 'Kuinet/Kapsuswa'] },
    { name: 'Turbo', wards: ['Ngenyilel', 'Tapsagoi', 'Kamagut', 'Kiplombe', 'Kapsaos', 'Huruma'] },
  ],
  'Trans Nzoia': [
    { name: 'Cherangany', wards: ['Sinyerere', 'Makutano', 'Kaplamai', 'Motongok', 'Cherangany-Suwerwa', 'Chepsiro/Kiptoror', 'Sitatunga'] },
    { name: 'Kiminini', wards: ['Kiminini', 'Waitaluk', 'Sirende', 'Hospital', 'Sikhendu', 'Nabiswa'] },
    { name: 'Saboti', wards: ['Kinyoro', 'Matisi', 'Tuwani', 'Saboti', 'Machewa'] },
    { name: 'Endebess', wards: ['Endebess', 'Matumbei', 'Chepchoina'] },
    { name: 'Kwanza', wards: ['Kapomboi', 'Kwanza', 'Keiyo', 'Bidii'] },
  ],
  'Nyeri': [
    { name: 'Mathira East', wards: ['Magutu', 'Iriaini', 'Konyu', 'Kirimukuyu', 'Karatina Town'] },
    { name: 'Mathira West', wards: ['Ruguru', 'Ngorano'] },
    { name: 'Tetu', wards: ['Dedan Kimathi', 'Wamagana', 'Aguthi-Gaaki'] },
    { name: 'Nyeri Town', wards: ['Rware', 'Kiganjo/Mathari', 'Ruring\'u', 'Kamakwa/Mukaro', 'Gatitu/Muruguru'] },
    { name: 'Othaya', wards: ['Mahiga', 'Iria-ini', 'Chinga', 'Karima'] },
    { name: 'Mukurweini', wards: ['Gikondi', 'Rugi', 'Mukurwe-ini West', 'Mukurwe-ini Central'] },
    { name: 'Kieni East', wards: ['Gakawa', 'Naromoru Kiamathaga', 'Thegu River', 'Kabaru'] },
    { name: 'Kieni West', wards: ['Mweiga', 'Amboni', 'Endarasha/Mwiyogo', 'Mugunda', 'Gatarakwa'] },
  ],
  'Meru': [
    { name: 'Central Imenti', wards: ['Mwanganthia', 'Abothuguchi Central', 'Abothuguchi West', 'Kiagu', 'Kibirichia'] },
    { name: 'North Imenti', wards: ['Municipality', 'Ntima East', 'Ntima West', 'Nyaki West', 'Nyaki East'] },
    { name: 'South Imenti', wards: ['Mitunguu', 'Igoji East', 'Igoji West', 'Abogeta East', 'Abogeta West', 'Nkuene'] },
    { name: 'Buuri', wards: ['Timau', 'Kisima', 'Kiirua/Naari', 'Ruiri/Rwarera'] },
    { name: 'Tigania East', wards: ['Thangatha', 'Mikinduri', 'Kiguchwa', 'Muthara', 'Karama'] },
    { name: 'Tigania West', wards: ['Athwana', 'Akithi', 'Kianjai', 'Nkomo', 'Mbeu'] },
    { name: 'Igembe Central', wards: ['Akirang\'ondu', 'Athiru Gaiti', 'Njia', 'Kangeta', 'Igembe East'] },
    { name: 'Igembe North', wards: ['Antuambui', 'Ntunene', 'Antubetwe Kiongo', 'Naathu', 'Amwathi'] },
    { name: 'Igembe South', wards: ['Maua', 'Kegoi/Antubochiu', 'Athiru Ruujine', 'Akachiu', 'Kanuni'] },
  ],
  'Kisumu': [
    { name: 'Muhoroni', wards: ['Miwani', 'Ombeyi', 'Masogo/Nyang\'oma', 'Chemelil', 'Muhoroni/Koru'] },
    { name: 'Nyando', wards: ['East Kano/Wawidhi', 'Awasi/Onjiko', 'Ahero', 'Kabonyo/Kanyagwal', 'Kobura'] },
    { name: 'Kisumu Central', wards: ['Railways', 'Migosi', 'Shaurimoyo Kaloleni', 'Market Milimani', 'Kondele', 'Nyalenda A'] },
    { name: 'Kisumu East', wards: ['Kajulu', 'Kolwa East', 'Manyatta B', 'Nyalenda B', 'Kolwa Central'] },
    { name: 'Kisumu West', wards: ['South West Kisumu', 'Central Kisumu', 'Kisumu North', 'West Kisumu', 'North West Kisumu'] },
    { name: 'Seme', wards: ['West Seme', 'Central Seme', 'East Seme'] },
    { name: 'Nyakach', wards: ['South East Nyakach', 'West Nyakach', 'North Nyakach', 'Central Nyakach', 'South West Nyakach'] },
  ],
  'Machakos': [
    { name: 'Machakos Town', wards: ['Kalama', 'Muvuti/Kiima-Kimwe', 'Machakos Central', 'Mumbuni North', 'Mutituni', 'Kola'] },
    { name: 'Mavoko', wards: ['Athi River', 'Kinanie', 'Muthwani', 'Syokimau/Mulolongo'] },
    { name: 'Kangundo', wards: ['Kangundo North', 'Kangundo Central', 'Kangundo East', 'Kangundo West'] },
    { name: 'Matungulu', wards: ['Tala', 'Matungulu North', 'Matungulu East', 'Matungulu West', 'Kyeleni'] },
    { name: 'Kathiani', wards: ['Mitaboni', 'Kathiani Central', 'Upper Kaewa/Iveti', 'Lower Kaewa/Kaani'] },
    { name: 'Yatta', wards: ['Ndalani', 'Matuu', 'Kithimani', 'Ikombe', 'Katangi'] },
    { name: 'Masinga', wards: ['Kivaa', 'Masinga Central', 'Ekalakala', 'Muthesya', 'Ndithini'] },
    { name: 'Mwala', wards: ['Mbiuni', 'Makutano/ Mwala', 'Masii', 'Muthetheni', 'Wamunyu', 'Kibauni'] },
  ],
  'Murang\'a': [
    { name: 'Kiharu', wards: ['Wangu', 'Mugoiri', 'Mbiri', 'Township', 'Murarandia', 'Gaturi'] },
    { name: 'Kangema', wards: ['Kanyenya-ini', 'Muguru', 'Rwathia'] },
    { name: 'Mathioya', wards: ['Gitugi', 'Kiru', 'Kamacharia'] },
    { name: 'Kandara', wards: ['Ng\'araria', 'Muruka', 'Kagundu-ini', 'Gaichanjiru', 'Ithiru', 'Ruchu'] },
    { name: 'Gatanga', wards: ['Ithanga', 'Kakuzi/Mitubiri', 'Mugumo-ini', 'Kihumbu-ini', 'Gatanga', 'Kariara'] },
    { name: 'Maragua', wards: ['Kimorori/Wempa', 'Makuyu', 'Kambiti', 'Kamahuha', 'Ichagaki', 'Nginda'] },
    { name: 'Kigumo', wards: ['Kahumbu', 'Muthithi', 'Kigumo', 'Kangari', 'Kinyona'] },
  ],
  'Kirinyaga': [
    { name: 'Kirinyaga Central', wards: ['Mutira', 'Kanyekini', 'Kerugoya', 'Inoi'] },
    { name: 'Gichugu', wards: ['Kabare', 'Baragwi', 'Njukiini', 'Ngariama', 'Karumandi'] },
    { name: 'Ndia', wards: ['Mukure', 'Kiine', 'Kariti'] },
    { name: 'Mwea', wards: ['Mutithi', 'Kangai', 'Thiba', 'Wamumu', 'Nyangati', 'Murinduko', 'Gathigiriri', 'Tebere'] },
  ],
  'Nyandarua': [
    { name: 'Kinangop', wards: ['Engineer', 'Gathara', 'North Kinangop', 'Murungaru', 'Njabini/Kiburu', 'Nyakio', 'Magumu', 'Githabai'] },
    { name: 'Kipipiri', wards: ['Wanjohi', 'Kipipiri', 'Geta', 'Githioro'] },
    { name: 'Ol Kalou', wards: ['Karau', 'Kanjuiri Ridge', 'Mirangine', 'Kaimbaga', 'Rurii'] },
    { name: 'Ol Joro Orok', wards: ['Gathanji', 'Gatimu', 'Weru', 'Charagita'] },
    { name: 'Ndaragwa', wards: ['Leshau/Pondo', 'Kiriita', 'Central', 'Shamata'] },
  ],
  'Kericho': [
    { name: 'Ainamoi', wards: ['Kapsoit', 'Ainamoi', 'Kipchebor', 'Kipchimchim', 'Kapsaos'] },
    { name: 'Belgut', wards: ['Waldai', 'Kabianga', 'Cheptoriet/Seretut', 'Chaik', 'Kapsuser'] },
    { name: 'Bureti', wards: ['Kisiara', 'Tebesonik', 'Cheboin', 'Chemosot', 'Litein', 'Roret', 'Kapkatet'] },
    { name: 'Kipkelion East', wards: ['Londiani', 'Kedowa/Kimugul', 'Chepseon', 'Tendeno/Sorget'] },
    { name: 'Kipkelion West', wards: ['Kunyet', 'Kipkelion', 'Chilchila'] },
    { name: 'Soin/Sigowet', wards: ['Sigowet', 'Kaplelartet', 'Soliat', 'Soin'] },
  ],
  'Bomet': [
    { name: 'Bomet Central', wards: ['Silibwet Township', 'Ndaraweta', 'Singorwet', 'Chesoen', 'Mutarakwa'] },
    { name: 'Bomet East', wards: ['Merigi', 'Kembu', 'Longisa', 'Kipreres', 'Chemaner'] },
    { name: 'Chepalungu', wards: ['Kong\'asis', 'Nyangores', 'Sigor', 'Chebunyo', 'Siongiroi'] },
    { name: 'Sotik', wards: ['Ndanai/Abosi', 'Chemagel', 'Kipsonoi', 'Aonet/Rongena', 'Manaret/Rongena'] },
    { name: 'Konoin', wards: ['Chepchabas', 'Kimulot', 'Mogogosiek', 'Boito', 'Embomos'] },
  ],
  'Kakamega': [
    { name: 'Lurambi', wards: ['Butsotso East', 'Butsotso South', 'Butsotso Central', 'Sheywe', 'Mahiakalo', 'Shirere'] },
    { name: 'Malava', wards: ['West Kabras', 'Chemuche', 'East Kabras', 'South Kabras', 'Manda-Shivanga', 'Shirugu-Mugai'] },
    { name: 'Mumias West', wards: ['Mumias Central', 'Mumias North', 'Etenje', 'Musanda'] },
    { name: 'Mumias East', wards: ['Lusheya/Lubinu', 'Malaha/Isongo/Makunga', 'East Wanga'] },
    { name: 'Matungu', wards: ['Koyonzo', 'Kholera', 'Khalaba', 'Mayoni', 'Namamali'] },
    { name: 'Butere', wards: ['Marama West', 'Marama Central', 'Marenyo-Shianda', 'Marama North', 'Marama South'] },
    { name: 'Shinyalu', wards: ['Isukha North', 'Isukha Central', 'Isukha South', 'Isukha East', 'Isukha West', 'Murhanda'] },
    { name: 'Ikolomani', wards: ['Idakho South', 'Idakho East', 'Idakho North', 'Idakho Central'] },
    { name: 'Lugari', wards: ['Mautuma', 'Lugari', 'Lumakanda', 'Chekalini', 'Chevaywa', 'Lwandeti'] },
  ],
  'Bungoma': [
    { name: 'Kanduyi', wards: ['Bukembe West', 'Bukembe East', 'Township', 'Khalaba', 'Musikoma', 'East Sang\'alo', 'Tuuti/Marakaru', 'West Sang\'alo'] },
    { name: 'Bumula', wards: ['Bumula', 'Khasoko', 'Kabula', 'Kimaeti', 'South Bukusu', 'Siboti'] },
    { name: 'Webuye East', wards: ['Mihuu', 'Ndivisi', 'Maraka'] },
    { name: 'Webuye West', wards: ['Sitikho', 'Matulo', 'Bokoli'] },
    { name: 'Sirisia', wards: ['Namwela', 'Malakisi/South Kulisiru', 'Lwandanyi'] },
    { name: 'Kabuchai', wards: ['Luchuna', 'Kabuchai/Chwele', 'West Nalondo', 'Bwake/Luuya', 'Mukuyuni'] },
    { name: 'Kimilili', wards: ['Kibingei', 'Kimilili', 'Maeni', 'Kamusinde'] },
    { name: 'Tongaren', wards: ['Mbakalo', 'Naitiri/Kabuyefwe', 'Milima', 'Ndalu/Tabani', 'Tongaren', 'Soysambu/Mitua'] },
  ],
  'Baringo': [
    { name: 'Baringo Central', wards: ['Kabarnet', 'Sacho', 'Tenges', 'Ewalel Chapchap', 'Kapropita'] },
    { name: 'Baringo North', wards: ['Barwessa', 'Kabartonjo', 'Saimo/Kipsaraman', 'Saimo/Soi', 'Bartabwa'] },
    { name: 'Baringo South', wards: ['Marigat', 'Ilchamus', 'Mochongoi', 'Mukutani'] },
    { name: 'Eldama Ravine', wards: ['Lembus', 'Lembus Kwen', 'Ravine', 'Mumberes/Maji Mazuri', 'Lembus/Pekerra'] },
    { name: 'Mogotio', wards: ['Mogotio', 'Emining', 'Kisanana'] },
  ],
  'Nandi': [
    { name: 'Chesumei', wards: ['Chemundu/Kapng\'etuny', 'Kosirai', 'Lelmokwo/Ngechek', 'Kaptumo-Kaboi', 'Kiptuya'] },
    { name: 'Emgwen', wards: ['Chepkumia', 'Kapkangani', 'Kapsabet', 'Kilibwoni'] },
    { name: 'Mosop', wards: ['Chepterwai', 'Kipkaren', 'Kurgung/Surungai', 'Kabiyet', 'Ndalat', 'Kabisaga', 'Sangalo/Kebulonik'] },
    { name: 'Nandi Hills', wards: ['Nandi Hills', 'Chepkunyuk', 'Ol\'lessos', 'Kapchorua'] },
    { name: 'Tinderet', wards: ['Songhor/Soba', 'Tindiret', 'Chemelil/Chemase', 'Kapsimancho'] },
    { name: 'Aldai', wards: ['Maraba', 'Terik', 'Kemeloi-Maraba', 'Kobujoi', 'Kaptumo-Kaboi', 'Koyo-Ndurio'] },
  ],
  'Laikipia': [
    { name: 'Laikipia East', wards: ['Ngobit', 'Tigithi', 'Thingithu', 'Nanyuki', 'Umande'] },
    { name: 'Laikipia West', wards: ['Ol-Moran', 'Rumuruti', 'Githiga', 'Marmanet', 'Igwamiti', 'Salama'] },
    { name: 'Laikipia North', wards: ['Sosian', 'Segera', 'Mugogodo West', 'Mugogodo East'] },
  ],
  'Embu': [
    { name: 'Manyatta', wards: ['Ruguru-Ngandori', 'Kithimu', 'Nginda', 'Mbeti North', 'Kirimari', 'Gaturi South'] },
    { name: 'Runyenjes', wards: ['Gaturi North', 'Kagaari North', 'Kagaari South', 'Central Ward', 'Kyeni North', 'Kyeni South'] },
    { name: 'Mbeere North', wards: ['Nthawa', 'Muminji', 'Evurore'] },
    { name: 'Mbeere South', wards: ['Mwea', 'Makima', 'Mbeti South', 'Mavuria', 'Kiambere'] },
  ],
  'Mombasa': [
    { name: 'Mvita', wards: ['Mji wa Kale/Makadara', 'Tudor', 'Tononoka', 'Shimanzi/Ganjoni', 'Majengo'] },
    { name: 'Nyali', wards: ['Frere Town', 'Ziwa la Ng\'ombe', 'Mkomani', 'Kongowea', 'Kadzandani'] },
    { name: 'Kisauni', wards: ['Mjambere', 'Junda', 'Bamburi', 'Mwakirunge', 'Mtopanga', 'Magogoni', 'Shanzu'] },
    { name: 'Changamwe', wards: ['Port Reitz', 'Kipevu', 'Airport', 'Changamwe', 'Chaani'] },
    { name: 'Jomvu', wards: ['Jomvu Kuu', 'Miritini', 'Mikindani'] },
    { name: 'Likoni', wards: ['Mtongwe', 'Shika Adabu', 'Bofu', 'Likoni', 'Timbwani'] },
  ],
  'Kilifi': [
    { name: 'Kilifi North', wards: ['Tezo', 'Sokoni', 'Kibarani', 'Dabaso', 'Matsangoni', 'Watamu', 'Mnarani'] },
    { name: 'Kilifi South', wards: ['Junju', 'Mwarakaya', 'Shimo la Tewa', 'Chasimba', 'Mtepeni'] },
    { name: 'Malindi', wards: ['Jilore', 'Kakuyuni', 'Ganda', 'Malindi Town', 'Shella'] },
    { name: 'Kaloleni', wards: ['Mariakani', 'Kayafungo', 'Kaloleni', 'Mwanamwinga'] },
  ],
};

/**
 * Returns available sub-counties for a given county.
 */
export function getSubCounties(county: string): string[] {
  if (!county) return [];
  const list = KENYA_LOCATIONS[county];
  if (list && list.length > 0) {
    return list.map((sc) => sc.name);
  }
  return [];
}

/**
 * Returns available wards / areas for a given county and sub-county.
 */
export function getWards(county: string, subCounty: string): string[] {
  if (!county || !subCounty) return [];
  const list = KENYA_LOCATIONS[county];
  if (!list) return [];
  const sc = list.find((item) => item.name.toLowerCase() === subCounty.toLowerCase());
  return sc ? sc.wards : [];
}

/**
 * Reverse geocodes or matches Kenya latitude and longitude to approximate location/place.
 */
export function resolveKenyaPlace(lat: number, lng: number): string {
  if (isNaN(lat) || isNaN(lng)) return '';

  // Proximity approximations for major agricultural hubs
  if (lat >= -1.25 && lat <= -1.05 && lng >= 36.85 && lng <= 37.15) {
    return 'Ruiru / Thika, Kiambu County';
  }
  if (lat >= -1.25 && lat <= -1.05 && lng >= 36.60 && lng <= 36.85) {
    return 'Limuru / Kikuyu, Kiambu County';
  }
  if (lat >= -1.45 && lat <= -1.15 && lng >= 36.70 && lng <= 37.05) {
    return 'Nairobi Area';
  }
  if (lat >= -0.45 && lat <= -0.15 && lng >= 35.90 && lng <= 36.25) {
    return 'Nakuru / Njoro, Nakuru County';
  }
  if (lat >= -0.90 && lat <= -0.60 && lng >= 36.30 && lng <= 36.55) {
    return 'Naivasha, Nakuru County';
  }
  if (lat >= 0.35 && lat <= 0.65 && lng >= 35.15 && lng <= 35.45) {
    return 'Eldoret / Moiben, Uasin Gishu County';
  }
  if (lat >= 0.85 && lat <= 1.20 && lng >= 34.85 && lng <= 35.15) {
    return 'Kitale / Cherangany, Trans Nzoia County';
  }
  if (lat >= -0.55 && lat <= -0.30 && lng >= 36.85 && lng <= 37.10) {
    return 'Nyeri / Karatina, Nyeri County';
  }
  if (lat >= -0.10 && lat <= 0.20 && lng >= 37.50 && lng <= 37.80) {
    return 'Meru / Imenti, Meru County';
  }
  if (lat >= -0.25 && lat <= 0.05 && lng >= 34.65 && lng <= 34.90) {
    return 'Kisumu / Nyando, Kisumu County';
  }
  if (lat >= -1.65 && lat <= -1.40 && lng >= 37.15 && lng <= 37.40) {
    return 'Machakos / Kangundo, Machakos County';
  }
  if (lat >= -0.75 && lat <= -0.45 && lng >= 37.00 && lng <= 37.25) {
    return 'Murang\'a / Maragua, Murang\'a County';
  }
  if (lat >= -0.65 && lat <= -0.35 && lng >= 37.25 && lng <= 37.45) {
    return 'Kirinyaga / Mwea, Kirinyaga County';
  }
  if (lat >= -0.45 && lat <= -0.20 && lng >= 35.15 && lng <= 35.40) {
    return 'Kericho, Kericho County';
  }
  if (lat >= -0.90 && lat <= -0.65 && lng >= 35.15 && lng <= 35.40) {
    return 'Bomet, Bomet County';
  }
  if (lat >= 0.40 && lat <= 0.70 && lng >= 34.65 && lng <= 34.90) {
    return 'Bungoma, Bungoma County';
  }
  if (lat >= 0.15 && lat <= 0.40 && lng >= 34.65 && lng <= 34.85) {
    return 'Kakamega, Kakamega County';
  }
  if (lat >= -4.20 && lat <= -3.90 && lng >= 39.55 && lng <= 39.75) {
    return 'Mombasa Coastal Area';
  }

  // Fallback lat/lng label
  return `${lat > 0 ? lat.toFixed(4) + '°N' : Math.abs(lat).toFixed(4) + '°S'}, ${lng > 0 ? lng.toFixed(4) + '°E' : Math.abs(lng).toFixed(4) + '°W'} (Kenya)`;
}

export const KENYA_COUNTY_COORDINATES: Record<string, { lat: number; lng: number }> = {
  'Mombasa': { lat: -4.0435, lng: 39.6682 },
  'Kwale': { lat: -4.1816, lng: 39.4606 },
  'Kilifi': { lat: -3.5107, lng: 39.9093 },
  'Tana River': { lat: -1.5000, lng: 40.0000 },
  'Lamu': { lat: -2.2717, lng: 40.9020 },
  'Taita Taveta': { lat: -3.3167, lng: 38.3500 },
  'Garissa': { lat: -0.4532, lng: 39.6460 },
  'Wajir': { lat: 1.7471, lng: 40.0573 },
  'Mandera': { lat: 3.9373, lng: 41.8569 },
  'Marsabit': { lat: 2.3284, lng: 37.9899 },
  'Isiolo': { lat: 0.3546, lng: 37.5822 },
  'Meru': { lat: 0.0463, lng: 37.6559 },
  'Tharaka-Nithi': { lat: -0.2970, lng: 37.8690 },
  'Embu': { lat: -0.5344, lng: 37.4574 },
  'Kitui': { lat: -1.3748, lng: 38.0106 },
  'Machakos': { lat: -1.5177, lng: 37.2634 },
  'Makueni': { lat: -1.8041, lng: 37.6203 },
  'Nyandarua': { lat: -0.1804, lng: 36.5230 },
  'Nyeri': { lat: -0.4201, lng: 36.9476 },
  'Kirinyaga': { lat: -0.4989, lng: 37.2803 },
  'Murang\'a': { lat: -0.7211, lng: 37.1526 },
  'Kiambu': { lat: -1.1714, lng: 36.8356 },
  'Turkana': { lat: 3.1167, lng: 35.6000 },
  'West Pokot': { lat: 1.2333, lng: 35.1167 },
  'Samburu': { lat: 1.1667, lng: 36.8000 },
  'Trans Nzoia': { lat: 1.0167, lng: 35.0000 },
  'Uasin Gishu': { lat: 0.5167, lng: 35.2833 },
  'Elgeyo-Marakwet': { lat: 0.8000, lng: 35.5000 },
  'Nandi': { lat: 0.1833, lng: 35.1000 },
  'Baringo': { lat: 0.4667, lng: 35.9667 },
  'Laikipia': { lat: 0.3333, lng: 36.7833 },
  'Nakuru': { lat: -0.3031, lng: 36.0800 },
  'Narok': { lat: -1.0833, lng: 35.8667 },
  'Kajiado': { lat: -1.8500, lng: 36.7833 },
  'Kericho': { lat: -0.3689, lng: 35.2863 },
  'Bomet': { lat: -0.7813, lng: 35.3416 },
  'Kakamega': { lat: 0.2827, lng: 34.7519 },
  'Vihiga': { lat: 0.0833, lng: 34.7167 },
  'Bungoma': { lat: 0.5695, lng: 34.5584 },
  'Busia': { lat: 0.4608, lng: 34.1115 },
  'Siaya': { lat: 0.0607, lng: 34.2882 },
  'Kisumu': { lat: -0.0917, lng: 34.7680 },
  'Homa Bay': { lat: -0.5273, lng: 34.4571 },
  'Migori': { lat: -1.0634, lng: 34.4731 },
  'Kisii': { lat: -0.6817, lng: 34.7667 },
  'Nyamira': { lat: -0.5633, lng: 34.9358 },
  'Nairobi': { lat: -1.2921, lng: 36.8219 },
};

// Sub-county specific geographic coordinates (e.g. Kakamega -> Shinyalu, Kiambu -> Ruiru, etc.)
export const KENYA_SUBCOUNTY_COORDINATES: Record<string, { lat: number; lng: number }> = {
  'Shinyalu': { lat: 0.2333, lng: 34.8500 },
  'Lurambi': { lat: 0.2833, lng: 34.7500 },
  'Malava': { lat: 0.4431, lng: 34.8540 },
  'Ikolomani': { lat: 0.1667, lng: 34.7500 },
  'Navakholo': { lat: 0.3833, lng: 34.6500 },
  'Mumias West': { lat: 0.3347, lng: 34.4870 },
  'Mumias East': { lat: 0.3500, lng: 34.5500 },
  'Matungu': { lat: 0.4000, lng: 34.4500 },
  'Butere': { lat: 0.2081, lng: 34.4920 },
  'Khwisero': { lat: 0.1500, lng: 34.5500 },
  'Likuyani': { lat: 0.7000, lng: 35.1167 },
  'Lugari': { lat: 0.5833, lng: 34.9167 },
  'Ruiru': { lat: -1.1533, lng: 36.9632 },
  'Thika Town': { lat: -1.0333, lng: 37.0694 },
  'Juja': { lat: -1.1000, lng: 37.0167 },
  'Limuru': { lat: -1.1000, lng: 36.6500 },
  'Njoro': { lat: -0.3333, lng: 35.9500 },
  'Rongai': { lat: -0.1667, lng: 35.8667 },
  'Moiben': { lat: 0.6167, lng: 35.4333 },
  'Cherangany': { lat: 1.1000, lng: 35.1667 },
};

export function getCountyCoordinates(county: string, subCounty?: string): { lat: number; lng: number } | null {
  if (subCounty && KENYA_SUBCOUNTY_COORDINATES[subCounty]) {
    return KENYA_SUBCOUNTY_COORDINATES[subCounty];
  }
  if (county && KENYA_COUNTY_COORDINATES[county]) {
    return KENYA_COUNTY_COORDINATES[county];
  }
  return null;
}

