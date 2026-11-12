/**
 * Comprehensive Kenya Administrative Geographic Reference
 * Covers all 47 Counties, Sub-Counties, and Wards / General Areas
 * Coordinates & Proximity-based Reverse Geocoding
 */

export interface SubCountyData {
  name: string;
  wards: string[];
}

export interface CountyData {
  county: string;
  subCounties: SubCountyData[];
}

export const KENYA_COUNTIES: string[] = [
  "Baringo",
  "Bomet",
  "Bungoma",
  "Busia",
  "Elgeyo-Marakwet",
  "Embu",
  "Garissa",
  "Homa Bay",
  "Isiolo",
  "Kajiado",
  "Kakamega",
  "Kericho",
  "Kiambu",
  "Kilifi",
  "Kirinyaga",
  "Kisii",
  "Kisumu",
  "Kitui",
  "Kwale",
  "Laikipia",
  "Lamu",
  "Machakos",
  "Makueni",
  "Mandera",
  "Marsabit",
  "Meru",
  "Migori",
  "Mombasa",
  "Murang'a",
  "Nairobi",
  "Nakuru",
  "Nandi",
  "Narok",
  "Nyamira",
  "Nyandarua",
  "Nyeri",
  "Samburu",
  "Siaya",
  "Taita-Taveta",
  "Tana River",
  "Tharaka-Nithi",
  "Trans Nzoia",
  "Turkana",
  "Uasin Gishu",
  "Vihiga",
  "Wajir",
  "West Pokot"
];

export const KENYA_LOCATIONS: Record<string, SubCountyData[]> = {
  "Baringo": [
    {
      "name": "Baringo Central",
      "wards": [
        "Kabarnet",
        "Sacho",
        "Tenges",
        "Ewalel Chapchap",
        "Kapropita"
      ]
    },
    {
      "name": "Baringo North",
      "wards": [
        "Barwessa",
        "Kabartonjo",
        "Saimo/Kipsaraman",
        "Saimo/Soi",
        "Bartabwa"
      ]
    },
    {
      "name": "Baringo South",
      "wards": [
        "Marigat",
        "Ilchamus",
        "Mochongoi",
        "Mukutani"
      ]
    },
    {
      "name": "Eldama Ravine",
      "wards": [
        "Lembus",
        "Lembus Kwen",
        "Ravine",
        "Mumberes/Maji Mazuri",
        "Lembus/Pekerra"
      ]
    },
    {
      "name": "Mogotio",
      "wards": [
        "Mogotio",
        "Emining",
        "Kisanana"
      ]
    },
    {
      "name": "Tiaty",
      "wards": [
        "Tirioko",
        "Kolowa",
        "Ribkwo",
        "Silale",
        "Tangulbei/Korosi",
        "Churo/Amaya"
      ]
    }
  ],
  "Bomet": [
    {
      "name": "Bomet Central",
      "wards": [
        "Silibwet Township",
        "Ndaraweta",
        "Singorwet",
        "Chesoen",
        "Mutarakwa"
      ]
    },
    {
      "name": "Bomet East",
      "wards": [
        "Merigi",
        "Kembu",
        "Longisa",
        "Kipreres",
        "Chemaner"
      ]
    },
    {
      "name": "Chepalungu",
      "wards": [
        "Kong'asis",
        "Nyangores",
        "Sigor",
        "Chebunyo",
        "Siongiroi"
      ]
    },
    {
      "name": "Sotik",
      "wards": [
        "Ndanai/Abosi",
        "Chemagel",
        "Kipsonoi",
        "Aonet/Rongena",
        "Manaret/Rongena"
      ]
    },
    {
      "name": "Konoin",
      "wards": [
        "Chepchabas",
        "Kimulot",
        "Mogogosiek",
        "Boito",
        "Embomos"
      ]
    }
  ],
  "Bungoma": [
    {
      "name": "Kanduyi",
      "wards": [
        "Bukembe West",
        "Bukembe East",
        "Township",
        "Khalaba",
        "Musikoma",
        "East Sang'alo",
        "Tuuti/Marakaru",
        "West Sang'alo"
      ]
    },
    {
      "name": "Bumula",
      "wards": [
        "Bumula",
        "Khasoko",
        "Kabula",
        "Kimaeti",
        "South Bukusu",
        "Siboti"
      ]
    },
    {
      "name": "Webuye East",
      "wards": [
        "Mihuu",
        "Ndivisi",
        "Maraka"
      ]
    },
    {
      "name": "Webuye West",
      "wards": [
        "Sitikho",
        "Matulo",
        "Bokoli"
      ]
    },
    {
      "name": "Sirisia",
      "wards": [
        "Namwela",
        "Malakisi/South Kulisiru",
        "Lwandanyi"
      ]
    },
    {
      "name": "Kabuchai",
      "wards": [
        "Luchuna",
        "Kabuchai/Chwele",
        "West Nalondo",
        "Bwake/Luuya",
        "Mukuyuni"
      ]
    },
    {
      "name": "Kimilili",
      "wards": [
        "Kibingei",
        "Kimilili",
        "Maeni",
        "Kamusinde"
      ]
    },
    {
      "name": "Tongaren",
      "wards": [
        "Mbakalo",
        "Naitiri/Kabuyefwe",
        "Milima",
        "Ndalu/Tabani",
        "Tongaren",
        "Soysambu/Mitua"
      ]
    },
    {
      "name": "Mt Elgon",
      "wards": [
        "Cheptais",
        "Chesikaki",
        "Chepyuk",
        "Kapkateny",
        "Kaptama",
        "Elgon"
      ]
    }
  ],
  "Busia": [
    {
      "name": "Matayos",
      "wards": [
        "Mayenje",
        "Bukhayo West",
        "Burumba",
        "Busibwabo",
        "Matayos South"
      ]
    },
    {
      "name": "Butula",
      "wards": [
        "Marachi West",
        "Kingandole",
        "Marachi Central",
        "Marachi East",
        "Marachi North"
      ]
    },
    {
      "name": "Nambale",
      "wards": [
        "Nambale Township",
        "Bukhayo North/Waltsi",
        "Bukhayo East",
        "Bukhayo Central"
      ]
    },
    {
      "name": "Funyula",
      "wards": [
        "Namboboto Nambuku",
        "Nangina",
        "Ageng'a Nanguba",
        "Bwiri"
      ]
    },
    {
      "name": "Budalangi",
      "wards": [
        "Bunyala Central",
        "Bunyala North",
        "Bunyala West",
        "Bunyala South"
      ]
    },
    {
      "name": "Teso North",
      "wards": [
        "Malaba Central",
        "Malaba North",
        "Ang'urai South",
        "Ang'urai North",
        "Ang'urai East",
        "Kolanya"
      ]
    },
    {
      "name": "Teso South",
      "wards": [
        "Ang'orom",
        "Chakoi South",
        "Chakoi North",
        "Amukura West",
        "Amukura Central",
        "Amukura East"
      ]
    }
  ],
  "Elgeyo-Marakwet": [
    {
      "name": "Keiyo North",
      "wards": [
        "Emsoo",
        "Kamariny",
        "Kapchemutwa",
        "Tambach"
      ]
    },
    {
      "name": "Keiyo South",
      "wards": [
        "Kaptarakwa",
        "Chepkorio",
        "Soy North",
        "Soy South",
        "Kabiemit",
        "Metkei"
      ]
    },
    {
      "name": "Marakwet East",
      "wards": [
        "Kapyego",
        "Sambirir",
        "Endo",
        "Embobut / Embolot"
      ]
    },
    {
      "name": "Marakwet West",
      "wards": [
        "Lelan",
        "Sengwer",
        "Cherang'any/Chebororwa",
        "Moiben/Kuserwo",
        "Kapsowar",
        "Arror"
      ]
    }
  ],
  "Embu": [
    {
      "name": "Manyatta",
      "wards": [
        "Ruguru-Ngandori",
        "Kithimu",
        "Nginda",
        "Mbeti North",
        "Kirimari",
        "Gaturi South"
      ]
    },
    {
      "name": "Runyenjes",
      "wards": [
        "Gaturi North",
        "Kagaari North",
        "Kagaari South",
        "Central Ward",
        "Kyeni North",
        "Kyeni South"
      ]
    },
    {
      "name": "Mbeere North",
      "wards": [
        "Nthawa",
        "Muminji",
        "Evurore"
      ]
    },
    {
      "name": "Mbeere South",
      "wards": [
        "Mwea",
        "Makima",
        "Mbeti South",
        "Mavuria",
        "Kiambere"
      ]
    }
  ],
  "Garissa": [
    {
      "name": "Garissa Township",
      "wards": [
        "Waberi",
        "Galbet",
        "Township",
        "Iftin"
      ]
    },
    {
      "name": "Balambala",
      "wards": [
        "Balambala",
        "Danyere",
        "Jarajara",
        "Saka",
        "Sankuri"
      ]
    },
    {
      "name": "Lagdera",
      "wards": [
        "Modogashe",
        "Benane",
        "Goreale",
        "Maalamin",
        "Sabena",
        "Baraki"
      ]
    },
    {
      "name": "Dadaab",
      "wards": [
        "Dertu",
        "Dadaab",
        "Labasigale",
        "Damajale",
        "Liboi",
        "Abakaile"
      ]
    },
    {
      "name": "Fafi",
      "wards": [
        "Bura",
        "Dekaharia",
        "Jarajilla",
        "Fafi",
        "Nanighi"
      ]
    },
    {
      "name": "Ijara",
      "wards": [
        "Hulugho",
        "Sangailu",
        "Ijara",
        "Masalani"
      ]
    }
  ],
  "Homa Bay": [
    {
      "name": "Homa Bay Town",
      "wards": [
        "Homa Bay Central",
        "Homa Bay Arujo",
        "Homa Bay West",
        "Homa Bay East"
      ]
    },
    {
      "name": "Ndhiwa",
      "wards": [
        "Kwabwai",
        "Kanyadoto",
        "Kanyikela",
        "Kabuoch North",
        "Kabuoch South/Pala",
        "Kanyamwa Kologi",
        "Kanyamwa Kosewe"
      ]
    },
    {
      "name": "Rachuonyo North",
      "wards": [
        "Ruma Kaksingri",
        "Kakelo Kokwanyo",
        "Karachuonyo Central",
        "West Karachuonyo",
        "Kibiri",
        "Wangchieng",
        "Kendu Bay Town"
      ]
    },
    {
      "name": "Rachuonyo South",
      "wards": [
        "Kasipul",
        "West Kasipul",
        "Central Kasipul",
        "East Kamagak",
        "South Kasipul"
      ]
    },
    {
      "name": "Rachuonyo East",
      "wards": [
        "Kojwach",
        "Kokwanyo/Kakelo",
        "Kabondo East",
        "Kabondo West"
      ]
    },
    {
      "name": "Rangwe",
      "wards": [
        "West Gem",
        "East Gem",
        "Kagan",
        "Kochia"
      ]
    },
    {
      "name": "Suba North",
      "wards": [
        "Rusinga Island",
        "Mfangano Island",
        "Kasgunga",
        "Gembe",
        "Lambwe"
      ]
    },
    {
      "name": "Suba South",
      "wards": [
        "Gwassi South",
        "Gwassi North",
        "Kaksingri West",
        "Ruma"
      ]
    }
  ],
  "Isiolo": [
    {
      "name": "Isiolo",
      "wards": [
        "Wabera",
        "Bulla Pesa",
        "Burat",
        "Ngare Mara",
        "Oldo/Nyiro"
      ]
    },
    {
      "name": "Merti",
      "wards": [
        "Chari",
        "Cherab"
      ]
    },
    {
      "name": "Garbatulla",
      "wards": [
        "Kinna",
        "Garbatulla",
        "Sericho"
      ]
    }
  ],
  "Kajiado": [
    {
      "name": "Kajiado Central",
      "wards": [
        "Purko",
        "Ildamat",
        "Dalalekutuk",
        "Matapato North",
        "Matapato South"
      ]
    },
    {
      "name": "Kajiado North",
      "wards": [
        "Olkeri",
        "Ongata Rongai",
        "Nkaimurunya",
        "Oloolua",
        "Ngong"
      ]
    },
    {
      "name": "Kajiado South",
      "wards": [
        "Entonet/Mbirikani",
        "Kuku",
        "Rombo",
        "Kimana",
        "Keekonyokie"
      ]
    },
    {
      "name": "Kajiado East",
      "wards": [
        "Kaputiei North",
        "Kitengela",
        "Oloosirkon/Sholinke",
        "Kenyawa-Poka",
        "Imaroro"
      ]
    },
    {
      "name": "Kajiado West",
      "wards": [
        "Keekonyokie",
        "Iloodokilani",
        "Magadi",
        "Ewuaso Oonkidong'i",
        "Mosiro"
      ]
    }
  ],
  "Kakamega": [
    {
      "name": "Lurambi",
      "wards": [
        "Butsotso East",
        "Butsotso South",
        "Butsotso Central",
        "Sheywe",
        "Mahiakalo",
        "Shirere"
      ]
    },
    {
      "name": "Malava",
      "wards": [
        "West Kabras",
        "Chemuche",
        "East Kabras",
        "South Kabras",
        "Manda-Shivanga",
        "Shirugu-Mugai"
      ]
    },
    {
      "name": "Mumias West",
      "wards": [
        "Mumias Central",
        "Mumias North",
        "Etenje",
        "Musanda"
      ]
    },
    {
      "name": "Mumias East",
      "wards": [
        "Lusheya/Lubinu",
        "Malaha/Isongo/Makunga",
        "East Wanga"
      ]
    },
    {
      "name": "Matungu",
      "wards": [
        "Koyonzo",
        "Kholera",
        "Khalaba",
        "Mayoni",
        "Namamali"
      ]
    },
    {
      "name": "Butere",
      "wards": [
        "Marama West",
        "Marama Central",
        "Marenyo-Shianda",
        "Marama North",
        "Marama South"
      ]
    },
    {
      "name": "Shinyalu",
      "wards": [
        "Isukha North",
        "Isukha Central",
        "Isukha South",
        "Isukha East",
        "Isukha West",
        "Murhanda"
      ]
    },
    {
      "name": "Ikolomani",
      "wards": [
        "Idakho South",
        "Idakho East",
        "Idakho North",
        "Idakho Central"
      ]
    },
    {
      "name": "Lugari",
      "wards": [
        "Mautuma",
        "Lugari",
        "Lumakanda",
        "Chekalini",
        "Chevaywa",
        "Lwandeti"
      ]
    },
    {
      "name": "Likuyani",
      "wards": [
        "Likuyani",
        "Sango",
        "Kongoni",
        "Sinoko",
        "Nzoia"
      ]
    },
    {
      "name": "Navakholo",
      "wards": [
        "Ingotse-Mathia",
        "Shinoyi-Kikaba",
        "Bunyala West",
        "Bunyala East",
        "Bunyala Central"
      ]
    },
    {
      "name": "Khwisero",
      "wards": [
        "Kisa North",
        "Kisa East",
        "Kisa West",
        "Kisa Central"
      ]
    }
  ],
  "Kericho": [
    {
      "name": "Ainamoi",
      "wards": [
        "Kapsoit",
        "Ainamoi",
        "Kipchebor",
        "Kipchimchim",
        "Kapsaos"
      ]
    },
    {
      "name": "Belgut",
      "wards": [
        "Waldai",
        "Kabianga",
        "Cheptoriet/Seretut",
        "Chaik",
        "Kapsuser"
      ]
    },
    {
      "name": "Bureti",
      "wards": [
        "Kisiara",
        "Tebesonik",
        "Cheboin",
        "Chemosot",
        "Litein",
        "Roret",
        "Kapkatet"
      ]
    },
    {
      "name": "Kipkelion East",
      "wards": [
        "Londiani",
        "Kedowa/Kimugul",
        "Chepseon",
        "Tendeno/Sorget"
      ]
    },
    {
      "name": "Kipkelion West",
      "wards": [
        "Kunyet",
        "Kipkelion",
        "Chilchila"
      ]
    },
    {
      "name": "Soin/Sigowet",
      "wards": [
        "Sigowet",
        "Kaplelartet",
        "Soliat",
        "Soin"
      ]
    }
  ],
  "Kiambu": [
    {
      "name": "Ruiru",
      "wards": [
        "Biashara",
        "Gitothua",
        "Kahawa Sukari",
        "Kahawa Wendani",
        "Kiuu",
        "Mwiki",
        "Mwihoko"
      ]
    },
    {
      "name": "Thika Town",
      "wards": [
        "Township",
        "Kamenu",
        "Hospital",
        "Gatuanyaga",
        "Ngoliba"
      ]
    },
    {
      "name": "Juja",
      "wards": [
        "Murera",
        "Theta",
        "Juja",
        "Witeithie",
        "Kalimoni"
      ]
    },
    {
      "name": "Kiambu Town",
      "wards": [
        "Ting'ang'a",
        "Ndumberi",
        "Riabai",
        "Township"
      ]
    },
    {
      "name": "Limuru",
      "wards": [
        "Bibirioni",
        "Limuru Central",
        "Ndeiya",
        "Ngecha Tigoni",
        "Limuru East"
      ]
    },
    {
      "name": "Kikuyu",
      "wards": [
        "Karai",
        "Nachu",
        "Sigona",
        "Kikuyu",
        "Kinoo"
      ]
    },
    {
      "name": "Kabete",
      "wards": [
        "Gitaru",
        "Muguga",
        "Nyadhuna",
        "Kabete",
        "Uthiru"
      ]
    },
    {
      "name": "Githunguri",
      "wards": [
        "Githunguri",
        "Githiga",
        "Ikinu",
        "Ngewa",
        "Komothai"
      ]
    },
    {
      "name": "Gatundu South",
      "wards": [
        "Kiamwangi",
        "Kiganjo",
        "Ndarugu",
        "Ng'enda"
      ]
    },
    {
      "name": "Gatundu North",
      "wards": [
        "Gituamba",
        "Githobokoni",
        "Chania",
        "Mang'u"
      ]
    },
    {
      "name": "Lari",
      "wards": [
        "Kinale",
        "Kijabe",
        "Nyanduma",
        "Kamburu",
        "Lari Scheme"
      ]
    },
    {
      "name": "Kiambaa",
      "wards": [
        "Cianda",
        "Karuri",
        "Ndenderu",
        "Muchatha",
        "Kihara"
      ]
    }
  ],
  "Kilifi": [
    {
      "name": "Kilifi North",
      "wards": [
        "Tezo",
        "Sokoni",
        "Kibarani",
        "Dabaso",
        "Matsangoni",
        "Watamu",
        "Mnarani"
      ]
    },
    {
      "name": "Kilifi South",
      "wards": [
        "Junju",
        "Mwarakaya",
        "Shimo la Tewa",
        "Chasimba",
        "Mtepeni"
      ]
    },
    {
      "name": "Malindi",
      "wards": [
        "Jilore",
        "Kakuyuni",
        "Ganda",
        "Malindi Town",
        "Shella"
      ]
    },
    {
      "name": "Magarini",
      "wards": [
        "Marafa",
        "Magarini",
        "Gongoni",
        "Adu",
        "Garashi",
        "Sabaki"
      ]
    },
    {
      "name": "Kaloleni",
      "wards": [
        "Mariakani",
        "Kayafungo",
        "Kaloleni",
        "Mwanamwinga"
      ]
    },
    {
      "name": "Rabai",
      "wards": [
        "Mwawesa",
        "Ruruma",
        "Kambe/Ribe",
        "Rabai/Kisurutini"
      ]
    },
    {
      "name": "Ganze",
      "wards": [
        "Ganze",
        "Bamba",
        "Jaribuni",
        "Sokoke"
      ]
    }
  ],
  "Kirinyaga": [
    {
      "name": "Kirinyaga Central",
      "wards": [
        "Mutira",
        "Kanyekini",
        "Kerugoya",
        "Inoi"
      ]
    },
    {
      "name": "Gichugu",
      "wards": [
        "Kabare",
        "Baragwi",
        "Njukiini",
        "Ngariama",
        "Karumandi"
      ]
    },
    {
      "name": "Ndia",
      "wards": [
        "Mukure",
        "Kiine",
        "Kariti"
      ]
    },
    {
      "name": "Mwea",
      "wards": [
        "Mutithi",
        "Kangai",
        "Thiba",
        "Wamumu",
        "Nyangati",
        "Murinduko",
        "Gathigiriri",
        "Tebere"
      ]
    }
  ],
  "Kisii": [
    {
      "name": "Kitutu Chache North",
      "wards": [
        "Monyerero",
        "Sensi",
        "Marani",
        "Kegogi"
      ]
    },
    {
      "name": "Kitutu Chache South",
      "wards": [
        "Bogusero",
        "Bogeka",
        "Nyakoe",
        "Kitutu Central",
        "Nyatieko"
      ]
    },
    {
      "name": "Nyaribari Masaba",
      "wards": [
        "Ichuni",
        "Nyamasibi",
        "Masimba",
        "Gesusu",
        "Kiamokama"
      ]
    },
    {
      "name": "Nyaribari Chache",
      "wards": [
        "Bobaracho",
        "Kisii Central",
        "Keumbu",
        "Kiogoro",
        "Birongo",
        "Ibeno"
      ]
    },
    {
      "name": "Bomachoge Borabu",
      "wards": [
        "Bombaba Borabu",
        "Boochi Borabu",
        "Bokimonge",
        "Magenche"
      ]
    },
    {
      "name": "Bomachoge Chache",
      "wards": [
        "Majoge Basi",
        "Boikanga",
        "Bosoti/Sengera"
      ]
    },
    {
      "name": "Bobasi",
      "wards": [
        "Masige West",
        "Masige East",
        "Bobasi Central",
        "Nyacheki",
        "Bassi Bogetaorio",
        "Bobasi Chache",
        "Sameta/Mokwerero",
        "Bobasi/Boitangare"
      ]
    },
    {
      "name": "South Mugirango",
      "wards": [
        "Bogetenga",
        "Borabu/Chitago",
        "Moticho",
        "Getenga",
        "Tabaka",
        "Boikanga"
      ]
    },
    {
      "name": "Bonchari",
      "wards": [
        "Bomorenda",
        "Riana",
        "Ruga",
        "Bogiakumu"
      ]
    }
  ],
  "Kisumu": [
    {
      "name": "Kisumu Central",
      "wards": [
        "Railways",
        "Migosi",
        "Shaurimoyo Kaloleni",
        "Market Milimani",
        "Kondele",
        "Nyalenda A"
      ]
    },
    {
      "name": "Kisumu East",
      "wards": [
        "Kajulu",
        "Kolwa East",
        "Manyatta B",
        "Nyalenda B",
        "Kolwa Central"
      ]
    },
    {
      "name": "Kisumu West",
      "wards": [
        "South West Kisumu",
        "Central Kisumu",
        "Kisumu North",
        "West Kisumu",
        "North West Kisumu"
      ]
    },
    {
      "name": "Muhoroni",
      "wards": [
        "Miwani",
        "Ombeyi",
        "Masogo/Nyang'oma",
        "Chemelil",
        "Muhoroni/Koru"
      ]
    },
    {
      "name": "Nyando",
      "wards": [
        "East Kano/Wawidhi",
        "Awasi/Onjiko",
        "Ahero",
        "Kabonyo/Kanyagwal",
        "Kobura"
      ]
    },
    {
      "name": "Seme",
      "wards": [
        "West Seme",
        "Central Seme",
        "East Seme"
      ]
    },
    {
      "name": "Nyakach",
      "wards": [
        "South East Nyakach",
        "West Nyakach",
        "North Nyakach",
        "Central Nyakach",
        "South West Nyakach"
      ]
    }
  ],
  "Kitui": [
    {
      "name": "Kitui Central",
      "wards": [
        "Miambani",
        "Township",
        "Kyangwithya West",
        "Mulango",
        "Kyangwithya East"
      ]
    },
    {
      "name": "Kitui West",
      "wards": [
        "Mutonguni",
        "Kauwi",
        "Matinyani",
        "Kwa Mutonga/Kithumula"
      ]
    },
    {
      "name": "Kitui East",
      "wards": [
        "Zombe/Mwitika",
        "Chuluni",
        "Nzambani",
        "Voo/Kyamatu",
        "Endau/Malalani",
        "Mutito/Kaliku"
      ]
    },
    {
      "name": "Kitui South",
      "wards": [
        "Ikanga/Kyatune",
        "Mutomo",
        "Mutha",
        "Ikutha",
        "Kanziko",
        "Athi"
      ]
    },
    {
      "name": "Kitui Rural",
      "wards": [
        "Kisasi",
        "Mbitini",
        "Yatta/Kwavonza",
        "Kanyangi"
      ]
    },
    {
      "name": "Mwingi North",
      "wards": [
        "Ngomeni",
        "Kyuso",
        "Mumoni",
        "Tseikuru",
        "Tharaka"
      ]
    },
    {
      "name": "Mwingi West",
      "wards": [
        "Kyome/Thaana",
        "Nguutani",
        "Migwani",
        "Kiomo/Kyethani"
      ]
    },
    {
      "name": "Mwingi Central",
      "wards": [
        "Kivou",
        "Nguni",
        "Nuu",
        "Mui",
        "Waita",
        "Central"
      ]
    }
  ],
  "Kwale": [
    {
      "name": "Msambweni",
      "wards": [
        "Gombato Bongwe",
        "Ukunda",
        "Kinondo",
        "Ramisi"
      ]
    },
    {
      "name": "Lungalunga",
      "wards": [
        "Pongwe/Kikoneni",
        "Dzombo",
        "Mwereni",
        "Vanga"
      ]
    },
    {
      "name": "Matuga",
      "wards": [
        "Tsimba Golini",
        "Waa",
        "Tiwi",
        "Kubo South",
        "Mkongani"
      ]
    },
    {
      "name": "Kinango",
      "wards": [
        "Ndavaya",
        "Puma",
        "Kinango",
        "Mackinnon Road",
        "Chengoni/Samburu",
        "Mwasache",
        "Kasemeni"
      ]
    }
  ],
  "Laikipia": [
    {
      "name": "Laikipia East",
      "wards": [
        "Ngobit",
        "Tigithi",
        "Thingithu",
        "Nanyuki",
        "Umande"
      ]
    },
    {
      "name": "Laikipia West",
      "wards": [
        "Ol-Moran",
        "Rumuruti",
        "Githiga",
        "Marmanet",
        "Igwamiti",
        "Salama"
      ]
    },
    {
      "name": "Laikipia North",
      "wards": [
        "Sosian",
        "Segera",
        "Mugogodo West",
        "Mugogodo East"
      ]
    }
  ],
  "Lamu": [
    {
      "name": "Lamu East",
      "wards": [
        "Faza",
        "Kiunga",
        "Basuba"
      ]
    },
    {
      "name": "Lamu West",
      "wards": [
        "Shella",
        "Mkomani",
        "Hindi",
        "Mkunumbi",
        "Hongwe",
        "Witu",
        "Bahari"
      ]
    }
  ],
  "Machakos": [
    {
      "name": "Machakos Town",
      "wards": [
        "Kalama",
        "Muvuti/Kiima-Kimwe",
        "Machakos Central",
        "Mumbuni North",
        "Mutituni",
        "Kola"
      ]
    },
    {
      "name": "Mavoko",
      "wards": [
        "Athi River",
        "Kinanie",
        "Muthwani",
        "Syokimau/Mulolongo"
      ]
    },
    {
      "name": "Kangundo",
      "wards": [
        "Kangundo North",
        "Kangundo Central",
        "Kangundo East",
        "Kangundo West"
      ]
    },
    {
      "name": "Matungulu",
      "wards": [
        "Tala",
        "Matungulu North",
        "Matungulu East",
        "Matungulu West",
        "Kyeleni"
      ]
    },
    {
      "name": "Kathiani",
      "wards": [
        "Mitaboni",
        "Kathiani Central",
        "Upper Kaewa/Iveti",
        "Lower Kaewa/Kaani"
      ]
    },
    {
      "name": "Yatta",
      "wards": [
        "Ndalani",
        "Matuu",
        "Kithimani",
        "Ikombe",
        "Katangi"
      ]
    },
    {
      "name": "Masinga",
      "wards": [
        "Kivaa",
        "Masinga Central",
        "Ekalakala",
        "Muthesya",
        "Ndithini"
      ]
    },
    {
      "name": "Mwala",
      "wards": [
        "Mbiuni",
        "Makutano/ Mwala",
        "Masii",
        "Muthetheni",
        "Wamunyu",
        "Kibauni"
      ]
    }
  ],
  "Makueni": [
    {
      "name": "Makueni",
      "wards": [
        "Wote",
        "Muvau/Kikuumini",
        "Mavindini",
        "Kitise/Kithuki",
        "Kathonzweni",
        "Nzaui/Kilili/Kalamba",
        "Mbitini"
      ]
    },
    {
      "name": "Kaiti",
      "wards": [
        "Ukia",
        "Kee",
        "Kilungu",
        "Ilima"
      ]
    },
    {
      "name": "Kibwezi West",
      "wards": [
        "Makindu",
        "Nguumo",
        "Kikumbulyu North",
        "Kikumbulyu South",
        "Nguu/Masumba",
        "Emali/Mulala"
      ]
    },
    {
      "name": "Kibwezi East",
      "wards": [
        "Masongaleni",
        "Mtito Andei",
        "Thange",
        "Ivingoni/Nzambani"
      ]
    },
    {
      "name": "Kilome",
      "wards": [
        "Kiima Kiu/Kalanzoni",
        "Mukaa",
        "Kasikeu"
      ]
    },
    {
      "name": "Mbooni",
      "wards": [
        "Tulimani",
        "Mbooni",
        "Kithungo/Kitundu",
        "Kiteta/Kisau",
        "Waia-Kako",
        "Kalawa"
      ]
    }
  ],
  "Mandera": [
    {
      "name": "Mandera West",
      "wards": [
        "Takaba South",
        "Takaba",
        "Lagsure",
        "Dandu",
        "Gither"
      ]
    },
    {
      "name": "Banissa",
      "wards": [
        "Banissa",
        "Derkhale",
        "Guba",
        "Malkamari",
        "Kiliwehiri"
      ]
    },
    {
      "name": "Mandera North",
      "wards": [
        "Rhamu",
        "Rhamu Dimtu",
        "Ashabito",
        "Guticha",
        "Marothile"
      ]
    },
    {
      "name": "Mandera South",
      "wards": [
        "Wargadud",
        "Kutulo",
        "Elwak South",
        "Elwak North",
        "Shimbir Fatuma"
      ]
    },
    {
      "name": "Mandera East",
      "wards": [
        "Arabia",
        "Township",
        "Neboi",
        "Khalalio",
        "Libehia"
      ]
    },
    {
      "name": "Lafey",
      "wards": [
        "Sala",
        "Fino",
        "Lafey",
        "Waranqara",
        "Alango Arba"
      ]
    }
  ],
  "Marsabit": [
    {
      "name": "Moyale",
      "wards": [
        "Butiye",
        "Sololo",
        "Heillu/Manyatta",
        "Golbo",
        "Moyale Township",
        "Uran",
        "Obbu"
      ]
    },
    {
      "name": "North Horr",
      "wards": [
        "Dukana",
        "Maikona",
        "Turbi",
        "North Horr",
        "Illeret"
      ]
    },
    {
      "name": "Saku",
      "wards": [
        "Sagante/Jaldesa",
        "Karare",
        "Marsabit Central"
      ]
    },
    {
      "name": "Laisamis",
      "wards": [
        "Loiyangalani",
        "Kargi/South Horr",
        "Korr/Ngurunit",
        "Logo Logo",
        "Laisamis"
      ]
    }
  ],
  "Meru": [
    {
      "name": "Central Imenti",
      "wards": [
        "Mwanganthia",
        "Abothuguchi Central",
        "Abothuguchi West",
        "Kiagu",
        "Kibirichia"
      ]
    },
    {
      "name": "North Imenti",
      "wards": [
        "Municipality",
        "Ntima East",
        "Ntima West",
        "Nyaki West",
        "Nyaki East"
      ]
    },
    {
      "name": "South Imenti",
      "wards": [
        "Mitunguu",
        "Igoji East",
        "Igoji West",
        "Abogeta East",
        "Abogeta West",
        "Nkuene"
      ]
    },
    {
      "name": "Buuri",
      "wards": [
        "Timau",
        "Kisima",
        "Kiirua/Naari",
        "Ruiri/Rwarera"
      ]
    },
    {
      "name": "Tigania East",
      "wards": [
        "Thangatha",
        "Mikinduri",
        "Kiguchwa",
        "Muthara",
        "Karama"
      ]
    },
    {
      "name": "Tigania West",
      "wards": [
        "Athwana",
        "Akithi",
        "Kianjai",
        "Nkomo",
        "Mbeu"
      ]
    },
    {
      "name": "Igembe Central",
      "wards": [
        "Akirang'ondu",
        "Athiru Gaiti",
        "Njia",
        "Kangeta",
        "Igembe East"
      ]
    },
    {
      "name": "Igembe North",
      "wards": [
        "Antuambui",
        "Ntunene",
        "Antubetwe Kiongo",
        "Naathu",
        "Amwathi"
      ]
    },
    {
      "name": "Igembe South",
      "wards": [
        "Maua",
        "Kegoi/Antubochiu",
        "Athiru Ruujine",
        "Akachiu",
        "Kanuni"
      ]
    }
  ],
  "Migori": [
    {
      "name": "Rongo",
      "wards": [
        "North Kamagambo",
        "Central Kamagambo",
        "East Kamagambo",
        "South Kamagambo"
      ]
    },
    {
      "name": "Awendo",
      "wards": [
        "North Sakwa",
        "South Sakwa",
        "West Sakwa",
        "Central Sakwa"
      ]
    },
    {
      "name": "Suna East",
      "wards": [
        "God Jope",
        "Suna Central",
        "Kakrao",
        "Kwa"
      ]
    },
    {
      "name": "Suna West",
      "wards": [
        "Wiga",
        "Wasweta II",
        "Ragana-Oruba",
        "Wasimbete"
      ]
    },
    {
      "name": "Uriri",
      "wards": [
        "West Huruma",
        "Central Kanyamkago",
        "South Kanyamkago",
        "North Kanyamkago",
        "East Kanyamkago"
      ]
    },
    {
      "name": "Nyatike",
      "wards": [
        "Kachieng",
        "Kanyasa",
        "North Kadem",
        "Macalder/Kanyarwanda",
        "Kaler",
        "Got Kachola",
        "Muhuru"
      ]
    },
    {
      "name": "Kuria West",
      "wards": [
        "Bukira East",
        "Bukira Central/Ikerege",
        "Isibania",
        "Makerero",
        "Masaba",
        "Tagare",
        "Nyamosense/Komosoko"
      ]
    },
    {
      "name": "Kuria East",
      "wards": [
        "Gokeharaka/Getambwega",
        "Ntimaru West",
        "Ntimaru East",
        "Nyabasi East",
        "Nyabasi West"
      ]
    }
  ],
  "Mombasa": [
    {
      "name": "Mvita",
      "wards": [
        "Mji wa Kale/Makadara",
        "Tudor",
        "Tononoka",
        "Shimanzi/Ganjoni",
        "Majengo"
      ]
    },
    {
      "name": "Nyali",
      "wards": [
        "Frere Town",
        "Ziwa la Ng'ombe",
        "Mkomani",
        "Kongowea",
        "Kadzandani"
      ]
    },
    {
      "name": "Kisauni",
      "wards": [
        "Mjambere",
        "Junda",
        "Bamburi",
        "Mwakirunge",
        "Mtopanga",
        "Magogoni",
        "Shanzu"
      ]
    },
    {
      "name": "Changamwe",
      "wards": [
        "Port Reitz",
        "Kipevu",
        "Airport",
        "Changamwe",
        "Chaani"
      ]
    },
    {
      "name": "Jomvu",
      "wards": [
        "Jomvu Kuu",
        "Miritini",
        "Mikindani"
      ]
    },
    {
      "name": "Likoni",
      "wards": [
        "Mtongwe",
        "Shika Adabu",
        "Bofu",
        "Likoni",
        "Timbwani"
      ]
    }
  ],
  "Murang'a": [
    {
      "name": "Kiharu",
      "wards": [
        "Wangu",
        "Mugoiri",
        "Mbiri",
        "Township",
        "Murarandia",
        "Gaturi"
      ]
    },
    {
      "name": "Kangema",
      "wards": [
        "Kanyenya-ini",
        "Muguru",
        "Rwathia"
      ]
    },
    {
      "name": "Mathioya",
      "wards": [
        "Gitugi",
        "Kiru",
        "Kamacharia"
      ]
    },
    {
      "name": "Kandara",
      "wards": [
        "Ng'araria",
        "Muruka",
        "Kagundu-ini",
        "Gaichanjiru",
        "Ithiru",
        "Ruchu"
      ]
    },
    {
      "name": "Gatanga",
      "wards": [
        "Ithanga",
        "Kakuzi/Mitubiri",
        "Mugumo-ini",
        "Kihumbu-ini",
        "Gatanga",
        "Kariara"
      ]
    },
    {
      "name": "Maragua",
      "wards": [
        "Kimorori/Wempa",
        "Makuyu",
        "Kambiti",
        "Kamahuha",
        "Ichagaki",
        "Nginda"
      ]
    },
    {
      "name": "Kigumo",
      "wards": [
        "Kahumbu",
        "Muthithi",
        "Kigumo",
        "Kangari",
        "Kinyona"
      ]
    }
  ],
  "Nairobi": [
    {
      "name": "Westlands",
      "wards": [
        "Kitisuru",
        "Parklands/Highridge",
        "Karura",
        "Kangemi",
        "Mountain View"
      ]
    },
    {
      "name": "Dagoretti North",
      "wards": [
        "Kilimani",
        "Kawangware",
        "Gatina",
        "Kileleshwa",
        "Kabiro"
      ]
    },
    {
      "name": "Dagoretti South",
      "wards": [
        "Mutu-ini",
        "Ng'ando",
        "Riruta",
        "Uthiru/Ruthimitu",
        "Waithaka"
      ]
    },
    {
      "name": "Lang'ata",
      "wards": [
        "Karen",
        "Nairobi West",
        "Mugumo-ini",
        "South C",
        "Nyayo Highrise"
      ]
    },
    {
      "name": "Kibra",
      "wards": [
        "Laini Saba",
        "Lindi",
        "Makina",
        "Woodley/Kenyatta Golf Course",
        "Sarang'ombe"
      ]
    },
    {
      "name": "Roysambu",
      "wards": [
        "Githurai",
        "Kahawa West",
        "Zimmerman",
        "Roysambu",
        "Kahawa"
      ]
    },
    {
      "name": "Kasarani",
      "wards": [
        "Clay City",
        "Mwiki",
        "Kasarani",
        "Njiru",
        "Ruai"
      ]
    },
    {
      "name": "Ruaraka",
      "wards": [
        "Babadogo",
        "Utalii",
        "Mathare North",
        "Lucky Summer",
        "Korogocho"
      ]
    },
    {
      "name": "Embakasi South",
      "wards": [
        "Imara Daima",
        "Kwa Njenga",
        "Kwa Reuben",
        "Pipeline",
        "Kware"
      ]
    },
    {
      "name": "Embakasi North",
      "wards": [
        "Kariobangi North",
        "Dandora Area I",
        "Dandora Area II",
        "Dandora Area III",
        "Dandora Area IV"
      ]
    },
    {
      "name": "Embakasi Central",
      "wards": [
        "Kayole North",
        "Kayole Central",
        "Kayole South",
        "Komarock",
        "Matopeni/Spring Valley"
      ]
    },
    {
      "name": "Embakasi East",
      "wards": [
        "Upper Savanna",
        "Lower Savanna",
        "Embakasi",
        "Utawala",
        "Mihang'o"
      ]
    },
    {
      "name": "Embakasi West",
      "wards": [
        "Umoja I",
        "Umoja II",
        "Mowlem",
        "Kariobangi South"
      ]
    },
    {
      "name": "Makadara",
      "wards": [
        "Maringo/Hamza",
        "Viwandani",
        "Harambee",
        "Makongeni"
      ]
    },
    {
      "name": "Kamukunji",
      "wards": [
        "Pumwani",
        "Eastleigh North",
        "Eastleigh South",
        "Airbase",
        "California"
      ]
    },
    {
      "name": "Starehe",
      "wards": [
        "Nairobi Central",
        "Ngara",
        "Pangani",
        "Ziwani/Kariokor",
        "Landi Mawe",
        "Nairobi South"
      ]
    },
    {
      "name": "Mathare",
      "wards": [
        "Hospital",
        "Mabatini",
        "Huruma",
        "Ngei",
        "Mlango Kubwa",
        "Kiamaiko"
      ]
    }
  ],
  "Nakuru": [
    {
      "name": "Njoro",
      "wards": [
        "Njoro",
        "Mau Narok",
        "Mauche",
        "Kihingo",
        "Nesuit",
        "Lare"
      ]
    },
    {
      "name": "Nakuru Town East",
      "wards": [
        "Biashara",
        "Kivumbini",
        "Flamingo",
        "Menengai",
        "Nakuru East"
      ]
    },
    {
      "name": "Nakuru Town West",
      "wards": [
        "Barut",
        "London",
        "Kaptembwo",
        "Kapkures",
        "Rhoda",
        "Shaabab"
      ]
    },
    {
      "name": "Rongai",
      "wards": [
        "Menengai West",
        "Soin",
        "Visoi",
        "Mosop",
        "Solai"
      ]
    },
    {
      "name": "Naivasha",
      "wards": [
        "Biashara",
        "Hells Gate",
        "Lake View",
        "Mai Mahiu",
        "Olkaria",
        "Naivasha East",
        "Viwandani"
      ]
    },
    {
      "name": "Gilgil",
      "wards": [
        "Gilgil",
        "Elembiita",
        "Kariandusi",
        "Murindat",
        "Malewa West"
      ]
    },
    {
      "name": "Subukia",
      "wards": [
        "Subukia",
        "Waseges",
        "Kabazi"
      ]
    },
    {
      "name": "Bahati",
      "wards": [
        "Dundori",
        "Kabatini",
        "Kiamaina",
        "Lanet Umoja",
        "Bahati"
      ]
    },
    {
      "name": "Molo",
      "wards": [
        "Mariashoni",
        "Elburgon",
        "Turi",
        "Molo"
      ]
    },
    {
      "name": "Kuresoi North",
      "wards": [
        "Kiptororo",
        "Nyota",
        "Sirikwa",
        "Kamara"
      ]
    },
    {
      "name": "Kuresoi South",
      "wards": [
        "Amalo",
        "Keringet",
        "Kiptagich",
        "Tinet"
      ]
    }
  ],
  "Nandi": [
    {
      "name": "Chesumei",
      "wards": [
        "Chemundu/Kapng'etuny",
        "Kosirai",
        "Lelmokwo/Ngechek",
        "Kaptumo-Kaboi",
        "Kiptuya"
      ]
    },
    {
      "name": "Emgwen",
      "wards": [
        "Chepkumia",
        "Kapkangani",
        "Kapsabet",
        "Kilibwoni"
      ]
    },
    {
      "name": "Mosop",
      "wards": [
        "Chepterwai",
        "Kipkaren",
        "Kurgung/Surungai",
        "Kabiyet",
        "Ndalat",
        "Kabisaga",
        "Sangalo/Kebulonik"
      ]
    },
    {
      "name": "Nandi Hills",
      "wards": [
        "Nandi Hills",
        "Chepkunyuk",
        "Ol'lessos",
        "Kapchorua"
      ]
    },
    {
      "name": "Tinderet",
      "wards": [
        "Songhor/Soba",
        "Tindiret",
        "Chemelil/Chemase",
        "Kapsimancho"
      ]
    },
    {
      "name": "Aldai",
      "wards": [
        "Maraba",
        "Terik",
        "Kemeloi-Maraba",
        "Kobujoi",
        "Kaptumo-Kaboi",
        "Koyo-Ndurio"
      ]
    }
  ],
  "Narok": [
    {
      "name": "Narok North",
      "wards": [
        "Olpusimoru",
        "Olokurto",
        "Nkareta",
        "Olorropil",
        "Melili",
        "Narok Town"
      ]
    },
    {
      "name": "Narok South",
      "wards": [
        "Majimoto/Naroosura",
        "Ololulung'a",
        "Melelo",
        "Loita",
        "Sogoo",
        "Sagamian"
      ]
    },
    {
      "name": "Narok East",
      "wards": [
        "Mosiro",
        "Ildamat",
        "Keekonyokie",
        "Suswa"
      ]
    },
    {
      "name": "Narok West",
      "wards": [
        "Ilmotiok",
        "Mara",
        "Siana",
        "Naikarra"
      ]
    },
    {
      "name": "Kilgoris",
      "wards": [
        "Kilgoris Central",
        "Keyian",
        "Angata Barikoi",
        "Shankoe",
        "Kimintet",
        "Lolgorian"
      ]
    },
    {
      "name": "Emurua Dikirr",
      "wards": [
        "Ilkerin",
        "Ololmasani",
        "Mogondo",
        "Kapsasian"
      ]
    }
  ],
  "Nyamira": [
    {
      "name": "West Mugirango",
      "wards": [
        "Nyamaiya",
        "Bogichora",
        "Bosamaro",
        "Bonyamatuta",
        "Township"
      ]
    },
    {
      "name": "North Mugirango",
      "wards": [
        "Itibo",
        "Bomwagamo",
        "Bokeira",
        "Magwagwa",
        "Ekerenyo"
      ]
    },
    {
      "name": "Borabu",
      "wards": [
        "Mekenene",
        "Kiabonyoru",
        "Nyansiongo",
        "Esise"
      ]
    },
    {
      "name": "Kitutu Masaba",
      "wards": [
        "Rigoma",
        "Gachuba",
        "Kemera",
        "Magombo",
        "Manga",
        "Gesima"
      ]
    }
  ],
  "Nyandarua": [
    {
      "name": "Kinangop",
      "wards": [
        "Engineer",
        "Gathara",
        "North Kinangop",
        "Murungaru",
        "Njabini/Kiburu",
        "Nyakio",
        "Magumu",
        "Githabai"
      ]
    },
    {
      "name": "Kipipiri",
      "wards": [
        "Wanjohi",
        "Kipipiri",
        "Geta",
        "Githioro"
      ]
    },
    {
      "name": "Ol Kalou",
      "wards": [
        "Karau",
        "Kanjuiri Ridge",
        "Mirangine",
        "Kaimbaga",
        "Rurii"
      ]
    },
    {
      "name": "Ol Joro Orok",
      "wards": [
        "Gathanji",
        "Gatimu",
        "Weru",
        "Charagita"
      ]
    },
    {
      "name": "Ndaragwa",
      "wards": [
        "Leshau/Pondo",
        "Kiriita",
        "Central",
        "Shamata"
      ]
    }
  ],
  "Nyeri": [
    {
      "name": "Mathira East",
      "wards": [
        "Magutu",
        "Iriaini",
        "Konyu",
        "Kirimukuyu",
        "Karatina Town"
      ]
    },
    {
      "name": "Mathira West",
      "wards": [
        "Ruguru",
        "Ngorano"
      ]
    },
    {
      "name": "Tetu",
      "wards": [
        "Dedan Kimathi",
        "Wamagana",
        "Aguthi-Gaaki"
      ]
    },
    {
      "name": "Nyeri Town",
      "wards": [
        "Rware",
        "Kiganjo/Mathari",
        "Ruring'u",
        "Kamakwa/Mukaro",
        "Gatitu/Muruguru"
      ]
    },
    {
      "name": "Othaya",
      "wards": [
        "Mahiga",
        "Iria-ini",
        "Chinga",
        "Karima"
      ]
    },
    {
      "name": "Mukurweini",
      "wards": [
        "Gikondi",
        "Rugi",
        "Mukurwe-ini West",
        "Mukurwe-ini Central"
      ]
    },
    {
      "name": "Kieni East",
      "wards": [
        "Gakawa",
        "Naromoru Kiamathaga",
        "Thegu River",
        "Kabaru"
      ]
    },
    {
      "name": "Kieni West",
      "wards": [
        "Mweiga",
        "Amboni",
        "Endarasha/Mwiyogo",
        "Mugunda",
        "Gatarakwa"
      ]
    }
  ],
  "Samburu": [
    {
      "name": "Samburu West",
      "wards": [
        "Lodokejek",
        "Suguta Marmar",
        "Maralal",
        "Loosuk",
        "Porro"
      ]
    },
    {
      "name": "Samburu North",
      "wards": [
        "El-Barta",
        "Nachola",
        "Ndoto",
        "Nyiro",
        "Angata Nanyokie",
        "Baawa"
      ]
    },
    {
      "name": "Samburu East",
      "wards": [
        "Wamba West",
        "Wamba East",
        "Wamba North",
        "Waso"
      ]
    }
  ],
  "Siaya": [
    {
      "name": "Alego Usonga",
      "wards": [
        "Siaya Township",
        "West Alego",
        "Central Alego",
        "North Alego",
        "South East Alego",
        "Usonga"
      ]
    },
    {
      "name": "Bondo",
      "wards": [
        "Yimbo East",
        "Yimbo West",
        "Central Sakwa",
        "South Sakwa",
        "West Sakwa"
      ]
    },
    {
      "name": "Gem",
      "wards": [
        "North Gem",
        "West Gem",
        "Central Gem",
        "Yala Township",
        "East Gem",
        "South Gem"
      ]
    },
    {
      "name": "Rarieda",
      "wards": [
        "East Asembo",
        "West Asembo",
        "North Uyoma",
        "South Uyoma",
        "West Uyoma"
      ]
    },
    {
      "name": "Ugenya",
      "wards": [
        "West Ugenya",
        "Ukwala",
        "North Ugenya",
        "East Ugenya"
      ]
    },
    {
      "name": "Ugunja",
      "wards": [
        "Sidindi",
        "Sigomere",
        "Ugunja"
      ]
    }
  ],
  "Taita-Taveta": [
    {
      "name": "Taveta",
      "wards": [
        "Chala",
        "Mahoo",
        "Bomeni",
        "Mboghoni",
        "Mata"
      ]
    },
    {
      "name": "Wundanyi",
      "wards": [
        "Wundanyi/Mbale",
        "Werugha",
        "Wumingu/Kishushe",
        "Mwanda/Mgange"
      ]
    },
    {
      "name": "Mwatate",
      "wards": [
        "Ronge",
        "Mwatate",
        "Bura",
        "Chawia",
        "Wusi/Kishamba"
      ]
    },
    {
      "name": "Voi",
      "wards": [
        "Mbololo",
        "Sagalla",
        "Kaloleni",
        "Marungu",
        "Kasigau",
        "Ngolia"
      ]
    }
  ],
  "Tana River": [
    {
      "name": "Garsen",
      "wards": [
        "Kipini East",
        "Garsen South",
        "Kipini West",
        "Garsen Central",
        "Garsen West",
        "Garsen North"
      ]
    },
    {
      "name": "Galole",
      "wards": [
        "Kinakomba",
        "Mikinduni",
        "Chewani",
        "Wayu"
      ]
    },
    {
      "name": "Bura",
      "wards": [
        "Chewele",
        "Hirimani",
        "Bangale",
        "Sala",
        "Madogo"
      ]
    }
  ],
  "Tharaka-Nithi": [
    {
      "name": "Tharaka",
      "wards": [
        "Gatunga",
        "Mukothima",
        "Nkondi",
        "Chiakariga",
        "Marimanti"
      ]
    },
    {
      "name": "Chuka/Igambang'ombe",
      "wards": [
        "Mariani",
        "Karingani",
        "Magumoni",
        "Mugwe",
        "Igambang'ombe"
      ]
    },
    {
      "name": "Maara",
      "wards": [
        "Mitheru",
        "Muthambi",
        "Mwimbi",
        "Ganga",
        "Chogoria"
      ]
    }
  ],
  "Trans Nzoia": [
    {
      "name": "Cherangany",
      "wards": [
        "Sinyerere",
        "Makutano",
        "Kaplamai",
        "Motongok",
        "Cherangany-Suwerwa",
        "Chepsiro/Kiptoror",
        "Sitatunga"
      ]
    },
    {
      "name": "Kiminini",
      "wards": [
        "Kiminini",
        "Waitaluk",
        "Sirende",
        "Hospital",
        "Sikhendu",
        "Nabiswa"
      ]
    },
    {
      "name": "Saboti",
      "wards": [
        "Kinyoro",
        "Matisi",
        "Tuwani",
        "Saboti",
        "Machewa"
      ]
    },
    {
      "name": "Endebess",
      "wards": [
        "Endebess",
        "Matumbei",
        "Chepchoina"
      ]
    },
    {
      "name": "Kwanza",
      "wards": [
        "Kapomboi",
        "Kwanza",
        "Keiyo",
        "Bidii"
      ]
    }
  ],
  "Turkana": [
    {
      "name": "Turkana Central",
      "wards": [
        "Kerio Delta",
        "Kang'atotha",
        "Kalokol",
        "Lodwar Township",
        "Kanamkemer"
      ]
    },
    {
      "name": "Turkana North",
      "wards": [
        "Kaeris",
        "Lake Zone",
        "Lapur",
        "Kaaleng/Kaikor",
        "Kibish",
        "Nakalale"
      ]
    },
    {
      "name": "Turkana West",
      "wards": [
        "Kakuma",
        "Lopur",
        "Letea",
        "Songot",
        "Kalobeyei",
        "Lokichoggio",
        "Nanaam"
      ]
    },
    {
      "name": "Turkana South",
      "wards": [
        "Lokichar",
        "Kaptir",
        "Katilu",
        "Lobokat",
        "Kalapata"
      ]
    },
    {
      "name": "Turkana East",
      "wards": [
        "Kapedo/Napeitom",
        "Katilia",
        "Lokori/Kochodin"
      ]
    },
    {
      "name": "Loima",
      "wards": [
        "Kotaruk/Lobei",
        "Turkwel",
        "Loima",
        "Lokiriama/Lorengippi"
      ]
    }
  ],
  "Uasin Gishu": [
    {
      "name": "Ainabkoi",
      "wards": [
        "Kapsoya",
        "Kaptagat",
        "Ainabkoi/Olare"
      ]
    },
    {
      "name": "Kapseret",
      "wards": [
        "Simat/Kapseret",
        "Kipkenyo",
        "Ngeria",
        "Megun",
        "Langas"
      ]
    },
    {
      "name": "Kesses",
      "wards": [
        "Racecourse",
        "Cheptiret/Kipchamo",
        "Tulwet/Chuiyat",
        "Tarakwa"
      ]
    },
    {
      "name": "Moiben",
      "wards": [
        "Temelio",
        "Sergoit",
        "Karuna/Meibeki",
        "Moiben",
        "Kimumu"
      ]
    },
    {
      "name": "Soy",
      "wards": [
        "Moi's Bridge",
        "Kapkures",
        "Ziwa",
        "Segero/Barsombe",
        "Kipsomba",
        "Soy",
        "Kuinet/Kapsuswa"
      ]
    },
    {
      "name": "Turbo",
      "wards": [
        "Ngenyilel",
        "Tapsagoi",
        "Kamagut",
        "Kiplombe",
        "Kapsaos",
        "Huruma"
      ]
    }
  ],
  "Vihiga": [
    {
      "name": "Vihiga",
      "wards": [
        "Lugaga-Wamuluma",
        "South Maragoli",
        "Central Maragoli",
        "Mungoma"
      ]
    },
    {
      "name": "Sabatia",
      "wards": [
        "Lyaduywa/Izava",
        "West Sabatia",
        "Chavakali",
        "North Maragoli",
        "Wodanga",
        "Busali"
      ]
    },
    {
      "name": "Hamisi",
      "wards": [
        "Shiru",
        "Gisambai",
        "Shamakhokho",
        "Banja",
        "Muhudu",
        "Tambua",
        "Jepkoyai"
      ]
    },
    {
      "name": "Luanda",
      "wards": [
        "Luanda Township",
        "Wemilabi",
        "Mwibona",
        "Luanda South",
        "Emabungo"
      ]
    },
    {
      "name": "Emuhaya",
      "wards": [
        "North East Bunyore",
        "Central Bunyore",
        "West Bunyore"
      ]
    }
  ],
  "Wajir": [
    {
      "name": "Wajir North",
      "wards": [
        "Gurar",
        "Bute",
        "Korondile",
        "Malkagufu",
        "Batalu",
        "Danaba",
        "Godoma"
      ]
    },
    {
      "name": "Wajir East",
      "wards": [
        "Wagberi",
        "Township",
        "Barwago",
        "Khorof Harar"
      ]
    },
    {
      "name": "Tarbaj",
      "wards": [
        "Elben",
        "Sarman",
        "Tarbaj",
        "Wargadud"
      ]
    },
    {
      "name": "Wajir West",
      "wards": [
        "Arbajahan",
        "Hadado/Athibohol",
        "Ademasajide",
        "Ganyure"
      ]
    },
    {
      "name": "Eldas",
      "wards": [
        "Eldas",
        "Della",
        "Lakoley South/Basir",
        "Elnur/Tula Tula"
      ]
    },
    {
      "name": "Wajir South",
      "wards": [
        "Benane",
        "Burder",
        "Dadajabula",
        "Habaswein",
        "Lagboghol South",
        "Ibrahim Ure",
        "Diff"
      ]
    }
  ],
  "West Pokot": [
    {
      "name": "Kapenguria",
      "wards": [
        "Kapenguria",
        "Mnagei",
        "Siyoi",
        "Endugh",
        "Riwo"
      ]
    },
    {
      "name": "Sigor",
      "wards": [
        "Weiwei",
        "Masol",
        "Lomut",
        "Sekerr"
      ]
    },
    {
      "name": "Kacheliba",
      "wards": [
        "Suam",
        "Kodich",
        "Kasei",
        "Kapchok",
        "Kiwawa",
        "Alale"
      ]
    },
    {
      "name": "Pokot South",
      "wards": [
        "Chepareria",
        "Batei",
        "Lelan",
        "Tapach"
      ]
    }
  ]
};

export const KENYA_COUNTY_COORDINATES: Record<string, { lat: number; lng: number }> = {
  "Mombasa": {
    "lat": -4.0435,
    "lng": 39.6682
  },
  "Kwale": {
    "lat": -4.1816,
    "lng": 39.4606
  },
  "Kilifi": {
    "lat": -3.5107,
    "lng": 39.9093
  },
  "Tana River": {
    "lat": -1.5,
    "lng": 40
  },
  "Lamu": {
    "lat": -2.2717,
    "lng": 40.902
  },
  "Taita-Taveta": {
    "lat": -3.3167,
    "lng": 38.35
  },
  "Taita Taveta": {
    "lat": -3.3167,
    "lng": 38.35
  },
  "Garissa": {
    "lat": -0.4532,
    "lng": 39.646
  },
  "Wajir": {
    "lat": 1.7471,
    "lng": 40.0573
  },
  "Mandera": {
    "lat": 3.9373,
    "lng": 41.8569
  },
  "Marsabit": {
    "lat": 2.3284,
    "lng": 37.9899
  },
  "Isiolo": {
    "lat": 0.3546,
    "lng": 37.5822
  },
  "Meru": {
    "lat": 0.0463,
    "lng": 37.6559
  },
  "Tharaka-Nithi": {
    "lat": -0.297,
    "lng": 37.869
  },
  "Tharaka Nithi": {
    "lat": -0.297,
    "lng": 37.869
  },
  "Embu": {
    "lat": -0.5344,
    "lng": 37.4574
  },
  "Kitui": {
    "lat": -1.3748,
    "lng": 38.0106
  },
  "Machakos": {
    "lat": -1.5177,
    "lng": 37.2634
  },
  "Makueni": {
    "lat": -1.8041,
    "lng": 37.6203
  },
  "Nyandarua": {
    "lat": -0.1804,
    "lng": 36.523
  },
  "Nyeri": {
    "lat": -0.4201,
    "lng": 36.9476
  },
  "Kirinyaga": {
    "lat": -0.4989,
    "lng": 37.2803
  },
  "Murang'a": {
    "lat": -0.7211,
    "lng": 37.1526
  },
  "Kiambu": {
    "lat": -1.1714,
    "lng": 36.8356
  },
  "Turkana": {
    "lat": 3.1167,
    "lng": 35.6
  },
  "West Pokot": {
    "lat": 1.2333,
    "lng": 35.1167
  },
  "Samburu": {
    "lat": 1.1667,
    "lng": 36.8
  },
  "Trans Nzoia": {
    "lat": 1.0167,
    "lng": 35
  },
  "Uasin Gishu": {
    "lat": 0.5167,
    "lng": 35.2833
  },
  "Elgeyo-Marakwet": {
    "lat": 0.8,
    "lng": 35.5
  },
  "Elgeyo Marakwet": {
    "lat": 0.8,
    "lng": 35.5
  },
  "Nandi": {
    "lat": 0.1833,
    "lng": 35.1
  },
  "Baringo": {
    "lat": 0.4667,
    "lng": 35.9667
  },
  "Laikipia": {
    "lat": 0.3333,
    "lng": 36.7833
  },
  "Nakuru": {
    "lat": -0.3031,
    "lng": 36.08
  },
  "Narok": {
    "lat": -1.0833,
    "lng": 35.8667
  },
  "Kajiado": {
    "lat": -1.85,
    "lng": 36.7833
  },
  "Kericho": {
    "lat": -0.3689,
    "lng": 35.2863
  },
  "Bomet": {
    "lat": -0.7813,
    "lng": 35.3416
  },
  "Kakamega": {
    "lat": 0.2827,
    "lng": 34.7519
  },
  "Vihiga": {
    "lat": 0.0833,
    "lng": 34.7167
  },
  "Bungoma": {
    "lat": 0.5695,
    "lng": 34.5584
  },
  "Busia": {
    "lat": 0.4608,
    "lng": 34.1115
  },
  "Siaya": {
    "lat": 0.0607,
    "lng": 34.2882
  },
  "Kisumu": {
    "lat": -0.0917,
    "lng": 34.768
  },
  "Homa Bay": {
    "lat": -0.5273,
    "lng": 34.4571
  },
  "Migori": {
    "lat": -1.0634,
    "lng": 34.4731
  },
  "Kisii": {
    "lat": -0.6817,
    "lng": 34.7667
  },
  "Nyamira": {
    "lat": -0.5633,
    "lng": 34.9358
  },
  "Nairobi": {
    "lat": -1.2921,
    "lng": 36.8219
  }
};

export const KENYA_SUBCOUNTY_COORDINATES: Record<string, { lat: number; lng: number }> = {
  "Matayos": {
    "lat": 0.4378,
    "lng": 34.1482
  },
  "Butula": {
    "lat": 0.35,
    "lng": 34.3333
  },
  "Nambale": {
    "lat": 0.4461,
    "lng": 34.2536
  },
  "Funyula": {
    "lat": 0.2833,
    "lng": 34.1
  },
  "Budalangi": {
    "lat": 0.1333,
    "lng": 34.0167
  },
  "Teso North": {
    "lat": 0.65,
    "lng": 34.2833
  },
  "Teso South": {
    "lat": 0.55,
    "lng": 34.2
  },
  "Shinyalu": {
    "lat": 0.2333,
    "lng": 34.85
  },
  "Lurambi": {
    "lat": 0.2833,
    "lng": 34.75
  },
  "Malava": {
    "lat": 0.4431,
    "lng": 34.854
  },
  "Ikolomani": {
    "lat": 0.1667,
    "lng": 34.75
  },
  "Navakholo": {
    "lat": 0.3833,
    "lng": 34.65
  },
  "Mumias West": {
    "lat": 0.3347,
    "lng": 34.487
  },
  "Mumias East": {
    "lat": 0.35,
    "lng": 34.55
  },
  "Matungu": {
    "lat": 0.4,
    "lng": 34.45
  },
  "Butere": {
    "lat": 0.2081,
    "lng": 34.492
  },
  "Khwisero": {
    "lat": 0.15,
    "lng": 34.55
  },
  "Likuyani": {
    "lat": 0.7,
    "lng": 35.1167
  },
  "Lugari": {
    "lat": 0.5833,
    "lng": 34.9167
  },
  "Ruiru": {
    "lat": -1.1533,
    "lng": 36.9632
  },
  "Thika Town": {
    "lat": -1.0333,
    "lng": 37.0694
  },
  "Juja": {
    "lat": -1.1,
    "lng": 37.0167
  },
  "Limuru": {
    "lat": -1.1,
    "lng": 36.65
  },
  "Kikuyu": {
    "lat": -1.25,
    "lng": 36.6667
  },
  "Kabete": {
    "lat": -1.2667,
    "lng": 36.7167
  },
  "Kiambu Town": {
    "lat": -1.1667,
    "lng": 36.8333
  },
  "Githunguri": {
    "lat": -1.05,
    "lng": 36.7833
  },
  "Gatundu South": {
    "lat": -1,
    "lng": 36.9
  },
  "Gatundu North": {
    "lat": -0.95,
    "lng": 36.9167
  },
  "Lari": {
    "lat": -0.9833,
    "lng": 36.6167
  },
  "Kiambaa": {
    "lat": -1.1833,
    "lng": 36.7833
  },
  "Njoro": {
    "lat": -0.3333,
    "lng": 35.95
  },
  "Rongai": {
    "lat": -0.1667,
    "lng": 35.8667
  },
  "Nakuru Town East": {
    "lat": -0.2833,
    "lng": 36.0833
  },
  "Nakuru Town West": {
    "lat": -0.29,
    "lng": 36.05
  },
  "Naivasha": {
    "lat": -0.7172,
    "lng": 36.4359
  },
  "Gilgil": {
    "lat": -0.4931,
    "lng": 36.2842
  },
  "Molo": {
    "lat": -0.2483,
    "lng": 35.7328
  },
  "Subukia": {
    "lat": -0.0167,
    "lng": 36.25
  },
  "Bahati": {
    "lat": -0.15,
    "lng": 36.15
  },
  "Moiben": {
    "lat": 0.6167,
    "lng": 35.4333
  },
  "Ainabkoi": {
    "lat": 0.4333,
    "lng": 35.4667
  },
  "Kapseret": {
    "lat": 0.45,
    "lng": 35.2167
  },
  "Kesses": {
    "lat": 0.2833,
    "lng": 35.3333
  },
  "Soy": {
    "lat": 0.6833,
    "lng": 35.15
  },
  "Turbo": {
    "lat": 0.6333,
    "lng": 35.05
  },
  "Cherangany": {
    "lat": 1.1,
    "lng": 35.1667
  },
  "Kiminini": {
    "lat": 0.9833,
    "lng": 34.9167
  },
  "Saboti": {
    "lat": 0.9333,
    "lng": 34.85
  },
  "Endebess": {
    "lat": 1.0667,
    "lng": 34.85
  },
  "Kwanza": {
    "lat": 1.1667,
    "lng": 35
  },
  "Kanduyi": {
    "lat": 0.5695,
    "lng": 34.5584
  },
  "Bumula": {
    "lat": 0.5,
    "lng": 34.45
  },
  "Webuye East": {
    "lat": 0.6,
    "lng": 34.7833
  },
  "Webuye West": {
    "lat": 0.6,
    "lng": 34.7
  },
  "Sirisia": {
    "lat": 0.7333,
    "lng": 34.4833
  },
  "Kimilili": {
    "lat": 0.7833,
    "lng": 34.7167
  },
  "Tongaren": {
    "lat": 0.8167,
    "lng": 34.9
  },
  "Kisumu Central": {
    "lat": -0.0917,
    "lng": 34.768
  },
  "Kisumu East": {
    "lat": -0.08,
    "lng": 34.8
  },
  "Kisumu West": {
    "lat": -0.05,
    "lng": 34.65
  },
  "Muhoroni": {
    "lat": -0.15,
    "lng": 35.2
  },
  "Nyando": {
    "lat": -0.1667,
    "lng": 34.9167
  },
  "Seme": {
    "lat": -0.1333,
    "lng": 34.5
  },
  "Nyakach": {
    "lat": -0.3333,
    "lng": 34.95
  },
  "Alego Usonga": {
    "lat": 0.0607,
    "lng": 34.2882
  },
  "Bondo": {
    "lat": -0.0983,
    "lng": 34.275
  },
  "Gem": {
    "lat": 0.1,
    "lng": 34.4
  },
  "Rarieda": {
    "lat": -0.1833,
    "lng": 34.3333
  },
  "Ugenya": {
    "lat": 0.2167,
    "lng": 34.25
  },
  "Ugunja": {
    "lat": 0.1833,
    "lng": 34.3
  },
  "Nyeri Town": {
    "lat": -0.4201,
    "lng": 36.9476
  },
  "Mathira East": {
    "lat": -0.4833,
    "lng": 37.1167
  },
  "Mathira West": {
    "lat": -0.45,
    "lng": 37.0833
  },
  "Othaya": {
    "lat": -0.5667,
    "lng": 36.9333
  },
  "Tetu": {
    "lat": -0.4333,
    "lng": 36.9
  },
  "North Imenti": {
    "lat": 0.0463,
    "lng": 37.6559
  },
  "Central Imenti": {
    "lat": 0,
    "lng": 37.6
  },
  "South Imenti": {
    "lat": -0.0833,
    "lng": 37.65
  },
  "Buuri": {
    "lat": 0.15,
    "lng": 37.55
  },
  "Machakos Town": {
    "lat": -1.5177,
    "lng": 37.2634
  },
  "Mavoko": {
    "lat": -1.45,
    "lng": 36.9833
  },
  "Kangundo": {
    "lat": -1.3,
    "lng": 37.35
  },
  "Matungulu": {
    "lat": -1.2333,
    "lng": 37.2833
  },
  "Westlands": {
    "lat": -1.2667,
    "lng": 36.8
  },
  "Dagoretti North": {
    "lat": -1.2833,
    "lng": 36.7667
  },
  "Lang'ata": {
    "lat": -1.3667,
    "lng": 36.75
  },
  "Kasarani": {
    "lat": -1.2167,
    "lng": 36.9
  },
  "Embakasi East": {
    "lat": -1.3,
    "lng": 36.9167
  },
  "Mvita": {
    "lat": -4.05,
    "lng": 39.6667
  },
  "Nyali": {
    "lat": -4.0333,
    "lng": 39.7
  },
  "Kisauni": {
    "lat": -4,
    "lng": 39.6833
  },
  "Changamwe": {
    "lat": -4.0333,
    "lng": 39.6333
  }
};

/**
 * Normalizes county name to match dictionary keys (handles hyphens, spacing, casing)
 */
function normalizeCountyKey(county: string): string {
  if (!county) return '';
  const trimmed = county.trim();
  if (KENYA_LOCATIONS[trimmed]) return trimmed;

  const lower = trimmed.toLowerCase();
  for (const key of Object.keys(KENYA_LOCATIONS)) {
    if (key.toLowerCase() === lower) return key;
    if (key.toLowerCase().replace(/-/g, ' ') === lower.replace(/-/g, ' ')) return key;
    if (key.toLowerCase().replace(/\s+/g, '-') === lower.replace(/\s+/g, '-')) return key;
  }
  return trimmed;
}

/**
 * Returns available sub-counties for a given county.
 */
export function getSubCounties(county: string): string[] {
  if (!county) return [];
  const normalizedKey = normalizeCountyKey(county);
  const list = KENYA_LOCATIONS[normalizedKey];
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
  const normalizedKey = normalizeCountyKey(county);
  const list = KENYA_LOCATIONS[normalizedKey];
  if (!list) return [];
  const sc = list.find((item) => item.name.toLowerCase() === subCounty.toLowerCase());
  return sc ? sc.wards : [];
}

/**
 * Gets county or sub-county geographic center coordinates.
 */
export function getCountyCoordinates(county: string, subCounty?: string): { lat: number; lng: number } | null {
  if (subCounty && KENYA_SUBCOUNTY_COORDINATES[subCounty]) {
    return KENYA_SUBCOUNTY_COORDINATES[subCounty];
  }
  if (county) {
    const norm = normalizeCountyKey(county);
    if (KENYA_COUNTY_COORDINATES[norm]) {
      return KENYA_COUNTY_COORDINATES[norm];
    }
    if (KENYA_COUNTY_COORDINATES[county]) {
      return KENYA_COUNTY_COORDINATES[county];
    }
  }
  return null;
}

/**
 * Calculates Haversine distance between two coordinates in kilometers.
 */
function haversineDistKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const toRad = (x: number) => (x * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return 6371 * c;
}

/**
 * Finds the nearest Kenya County and Sub-County for a given GPS coordinate.
 */
export function findNearestKenyaLocation(
  lat: number,
  lng: number
): {
  county: string;
  subCounty: string;
  ward?: string;
  distanceKm: number;
} | null {
  if (isNaN(lat) || isNaN(lng)) return null;

  // Kenya approximate bounding box: Lat -5 to +5.5, Lng 33.5 to 42.0
  if (lat < -5.5 || lat > 5.5 || lng < 33.5 || lng > 42.0) {
    return null;
  }

  let nearestSub: { county: string; subCounty: string; distanceKm: number } | null = null;
  let minSubDist = Infinity;

  // 1. Check all sub-counties
  for (const [subName, coords] of Object.entries(KENYA_SUBCOUNTY_COORDINATES)) {
    const dist = haversineDistKm(lat, lng, coords.lat, coords.lng);
    if (dist < minSubDist) {
      minSubDist = dist;
      let parentCounty = '';
      for (const [cName, subs] of Object.entries(KENYA_LOCATIONS)) {
        if (subs.some((s) => s.name.toLowerCase() === subName.toLowerCase())) {
          parentCounty = cName;
          break;
        }
      }
      if (parentCounty) {
        nearestSub = { county: parentCounty, subCounty: subName, distanceKm: Math.round(dist * 10) / 10 };
      }
    }
  }

  // 2. Check county centroids
  let nearestCounty: { county: string; distanceKm: number } | null = null;
  let minCountyDist = Infinity;
  for (const [cName, coords] of Object.entries(KENYA_COUNTY_COORDINATES)) {
    const dist = haversineDistKm(lat, lng, coords.lat, coords.lng);
    if (dist < minCountyDist) {
      minCountyDist = dist;
      nearestCounty = { county: cName, distanceKm: Math.round(dist * 10) / 10 };
    }
  }

  if (nearestSub && minSubDist <= 40) {
    return nearestSub;
  }

  if (nearestCounty) {
    const subs = getSubCounties(nearestCounty.county);
    return {
      county: nearestCounty.county,
      subCounty: subs.length > 0 ? subs[0] : '',
      distanceKm: nearestCounty.distanceKm,
    };
  }

  return null;
}

/**
 * Reverse geocodes or matches Kenya latitude and longitude to approximate location/place.
 */
export function resolveKenyaPlace(lat: number, lng: number): string {
  if (isNaN(lat) || isNaN(lng)) return '';

  const nearest = findNearestKenyaLocation(lat, lng);
  if (nearest && nearest.distanceKm <= 50) {
    return `${nearest.subCounty ? nearest.subCounty + ', ' : ''}${nearest.county} County (${nearest.distanceKm} km)`;
  }

  return `${lat > 0 ? lat.toFixed(4) + '°N' : Math.abs(lat).toFixed(4) + '°S'}, ${lng > 0 ? lng.toFixed(4) + '°E' : Math.abs(lng).toFixed(4) + '°W'} (Kenya)`;
}

/**
 * Reverse geocodes coordinates via OpenStreetMap Nominatim with Kenya-specific extraction.
 */
export async function reverseGeocodeKenyaLocation(
  lat: number,
  lng: number
): Promise<{
  county?: string;
  subCounty?: string;
  ward?: string;
  displayName?: string;
} | null> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=14&addressdetails=1`,
      {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'MavunoTrust-FarmLocation/1.0',
        },
      }
    );
    clearTimeout(timer);
    if (!res.ok) return null;
    const data = await res.json();
    const addr = data.address || {};

    let county = addr.county || addr.state || '';
    county = county.replace(/\s+county/i, '').trim();

    // Map common Kenyan county variations
    if (/busia/i.test(county) || /matayos/i.test(data.display_name || '')) county = 'Busia';
    if (/kiambu/i.test(county)) county = 'Kiambu';
    if (/nakuru/i.test(county)) county = 'Nakuru';
    if (/nairobi/i.test(county)) county = 'Nairobi';
    if (/kakamega/i.test(county)) county = 'Kakamega';
    if (/bungoma/i.test(county)) county = 'Bungoma';
    if (/uasin gishu/i.test(county) || /eldoret/i.test(data.display_name || '')) county = 'Uasin Gishu';

    const subCounty =
      addr.city ||
      addr.town ||
      addr.municipality ||
      addr.district ||
      addr.suburb ||
      '';

    const ward =
      addr.suburb ||
      addr.neighbourhood ||
      addr.village ||
      addr.quarter ||
      '';

    return {
      county,
      subCounty,
      ward,
      displayName: data.display_name,
    };
  } catch {
    return null;
  }
}

