export const historyContent = {
  maxHearts: 5,
  xpPerReading: 10,
  xpPerCorrectAnswer: 5,
  xpPerIslandPerfect: 25,
  campaigns: [
    {
      id: "eastern_orthodox_history",
      displayName: "Eastern Orthodox History",
      fullSetTitle: "The Full Eastern Armor of God",
      theme: "byzantine",
      islands: [
        {
          id: "eo_1",
          title: "Apostolic & Patristic Roots (33–313)",
          awardPiece: "belt_of_truth",
          reading: "The Orthodox Church began on the Day of Pentecost, fifty days after Jesus rose from the dead. The Holy Spirit came down on the Apostles in Jerusalem like fire. This changed them from scared followers into brave leaders who could speak different languages and tell everyone about Jesus. Peter gave a great speech that day, and three thousand people joined the Church.\n\nThe Apostles traveled all over the known world. Peter went to Rome, Andrew to Greece, Thomas to India, Mark to Egypt, and Paul traveled through many countries in Asia and Greece. Each Apostle started Christian communities, chose bishops to lead them, and taught them what Jesus taught. These early churches grew in their own ways but stayed united in their beliefs.\n\nThe first few hundred years were very hard for Christians. Roman emperors like Nero and Diocletian hurt and killed many Christians because they refused to worship the emperor or false gods. But even though many Christians died for their faith (these brave people are called martyrs), the Church kept growing. A writer named Tertullian said that 'the blood of martyrs is the seed of the Church,' meaning that when Christians died bravely for Jesus, more people wanted to become Christians.\n\nSome famous early martyrs were Ignatius of Antioch, who was thrown to lions in Rome, and Polycarp of Smyrna, who was 86 years old when he was burned for refusing to deny Christ. These brave people wrote letters and prayers that we still read today.\n\nThe Apostolic Fathers were Christian leaders who either knew the Apostles personally or learned from people who did. They helped the Church understand what to believe and how to worship. The idea of Apostolic Succession became important - this means that every bishop can trace their ordination in an unbroken line back to the Apostles themselves. This helps us know that what the Church teaches today is the same as what Jesus taught.",
          quiz: [
            {
              question: "What event marks the birth of the Church in Orthodox understanding?",
              options: ["Pentecost", "Council of Nicaea", "Edict of Milan", "Fall of Jerusalem (70 AD)"],
              correctAnswer: 0
            },
            {
              question: "What is Apostolic Succession?",
              options: ["The line of bishops tracing back to the Apostles", "A rotation of parish councils", "The election of emperors by clergy", "A list of monastic rules"],
              correctAnswer: 0
            },
            {
              question: "Early martyrs are primarily remembered for:",
              options: ["Witness to Christ even unto death", "Writing the Nicene Creed", "Leading crusades", "Inventing church architecture"],
              correctAnswer: 0
            },
            {
              question: "Which group includes figures like Ignatius of Antioch and Polycarp?",
              options: ["Apostolic Fathers", "Scholastics", "Iconographers", "Desert Philologists"],
              correctAnswer: 0
            },
            {
              question: "Orthodoxy emphasizes both right teaching and right worship, known as:",
              options: ["Orthodoxy and Orthopraxy", "Theoria and Praxis", "Scholasticism and Mysticism", "Canon and Custom"],
              correctAnswer: 0
            }
          ]
        },
        {
          id: "eo_2",
          title: "Imperial Church & Ecumenical Councils (313–787)",
          awardPiece: "breastplate_of_righteousness",
          reading: "In the year 313 AD, everything changed for Christians. Emperor Constantine made Christianity legal throughout the Roman Empire. He had seen a vision before a big battle and believed God helped him win. Constantine moved the capital from Rome to a city called Byzantium, which he renamed Constantinople. This became a beautiful Christian city filled with churches and holy relics.\n\nBut now that Christianity was legal, a new problem arose: people started arguing about what Christians should believe. A priest named Arius said that Jesus wasn't fully God but was created by God the Father. This was wrong and very dangerous because if Jesus isn't fully God, He can't save us. Constantine brought together 318 bishops from all over the world to meet at Nicaea in 325 AD.\n\nAt Nicaea, the bishops - many of whom still had scars from being persecuted - wrote the Nicene Creed. They said Jesus is 'of one essence' with the Father, which means He is fully God, not a created being. A young man named Athanasius became a champion of this truth. He taught that 'God became man so that man might become god' - meaning that Jesus became human so we could become like God by His grace.\n\nMore councils followed to answer other questions. The Second Council at Constantinople in 381 AD said the Holy Spirit is also fully God. The Nicene-Constantinopolitan Creed that we say in church today comes from this council.\n\nThe Third Council at Ephesus in 431 AD taught that Mary is the Theotokos (God-bearer) because she didn't just give birth to a man, but to God who became man. The Council of Chalcedon in 451 AD taught that Jesus is one person with two complete natures - fully God and fully human at the same time.\n\nIn the 700s, some emperors tried to ban icons (holy pictures). They destroyed beautiful artwork and hurt people who painted icons. But St. John of Damascus taught that since Jesus took on a human body, He can be shown in pictures. Icons are windows to heaven, not idols. The Seventh Council at Nicaea in 787 AD said it's good to honor (but not worship) icons. The Church celebrates this victory every year on the first Sunday of Great Lent.",
          quiz: [
            {
              question: "What did the Edict of Milan (313) do?",
              options: ["Legalized Christianity", "Declared Christianity the state religion immediately", "Condemned icons permanently", "Split East and West"],
              correctAnswer: 0
            },
            {
              question: "Which council affirmed the Son is of one essence with the Father?",
              options: ["Nicaea I (325)", "Ephesus (431)", "Lateran IV", "Trent"],
              correctAnswer: 0
            },
            {
              question: "Orthodox veneration of icons was upheld by:",
              options: ["The Seventh Ecumenical Council (787)", "The Edict of Thessalonica", "The First Crusade", "The Photian Council"],
              correctAnswer: 0
            },
            {
              question: "Chalcedon taught that Christ is:",
              options: ["One person in two natures", "Two persons in one nature", "Only divine without humanity", "Only human without divinity"],
              correctAnswer: 0
            },
            {
              question: "Which city became the Christian imperial capital?",
              options: ["Constantinople", "Rome", "Antioch", "Alexandria"],
              correctAnswer: 0
            }
          ]
        },
        {
          id: "eo_3",
          title: "Mission & Monasticism; Slavs and Beyond (4th–10th c.)",
          awardPiece: "sandals_of_gospel_of_peace",
          reading: "While Christianity was becoming legal, some Christians wanted to live completely dedicated to God. St. Anthony the Great sold everything he owned and went to live in the Egyptian desert. He spent his time praying, fasting, and fighting spiritual battles against demons. Many others followed his example, and the desert filled with holy men and women called monks.\n\nSt. Pachomius started the first monastery where monks lived together, prayed together, and worked together. The Desert Fathers and Mothers shared wise sayings like 'Stay in your cell, and your cell will teach you everything.' St. Basil the Great created rules for monasteries that balanced prayer, work, and helping the poor. He even built hospitals and places to help needy people.\n\nTwo brothers, Saints Cyril and Methodius, became great missionaries. A prince asked them to teach his people about Christ in their own language. The brothers created a whole new alphabet so people could read the Bible and pray in their own language instead of only in Greek or Latin. This was revolutionary! They translated the Bible and church services into Slavonic. Though some Western church leaders didn't like this, it became the Orthodox way: let every nation worship God in their own language.\n\nThe disciples of Cyril and Methodius went to Bulgaria and created the Cyrillic alphabet (named after Cyril), which many countries still use today. From Bulgaria, Orthodox Christianity spread to Serbia and then to Russia. In 988, Prince Vladimir of Kiev chose Orthodox Christianity for his nation. His messengers had visited the great church of Hagia Sophia in Constantinople and said, 'We didn't know if we were in heaven or on earth, for surely there is no such beauty anywhere on earth!'\n\nOrthodox Christians developed beautiful ways of worship. Byzantine chant filled churches with angelic singing. Iconographers created holy images following strict rules that showed spiritual truths. The Jesus Prayer ('Lord Jesus Christ, Son of God, have mercy on me, a sinner') became the constant prayer of monks and regular Christians alike, helping people pray all the time as the Bible says.",
          quiz: [
            {
              question: "Who evangelized the Slavs and created a missionary alphabet?",
              options: ["Saints Cyril and Methodius", "Saints Peter and Paul", "Saints Benedict and Scholastica", "Saints Francis and Clare"],
              correctAnswer: 0
            },
            {
              question: "Which tradition helped organize communal monastic life in the East?",
              options: ["St. Basil's monastic rule", "St. Benedict's rule", "Carthusian statutes", "Ignatian exercises"],
              correctAnswer: 0
            },
            {
              question: "Byzantine iconography is understood primarily as:",
              options: ["Theology in color and prayer", "Secular decoration", "Historical caricature", "Legal codex"],
              correctAnswer: 0
            },
            {
              question: "The 'prayer of the heart' is associated with:",
              options: ["Hesychastic spirituality", "Scholastic disputation", "Liturgical minimalism", "Iconoclasm"],
              correctAnswer: 0
            }
          ]
        },
        {
          id: "eo_4",
          title: "The Great Schism (11th c.)",
          awardPiece: "shield_of_faith",
          reading: "Over many centuries, the Eastern and Western parts of the Church slowly grew apart. The Western Roman Empire fell, but Byzantium (the Eastern Empire) continued strong. The West started using only Latin, while the East used Greek. They started thinking about theology in different ways and doing things differently in church.\n\nOne big disagreement was about the Creed. The original Creed said the Holy Spirit 'proceeds from the Father.' But churches in Spain added 'and the Son' (in Latin: Filioque) without asking the whole Church. Rome eventually accepted this change. The Eastern Church said this was wrong because only a council of the whole Church can change the Creed, and the change seemed to make the Holy Spirit less than the Father.\n\nAnother disagreement was about the Pope. Rome said the Pope was the boss of all churches everywhere. The East said that while Rome deserved special honor, the Church should be led by the five patriarchs (Rome, Constantinople, Alexandria, Antioch, and Jerusalem) working together, not by one person alone.\n\nThings came to a head in 1054. Pope Leo IX sent Cardinal Humbert to Constantinople to settle some arguments. But Humbert and Patriarch Michael Cerularios couldn't agree and got angry at each other. On July 16, 1054, Humbert marched into Hagia Sophia during the service and slammed a paper excommunicating the Patriarch on the altar! The Patriarch excommunicated Humbert right back. Though these excommunications were technically just against individuals, they symbolized the break between East and West.\n\nThings got much worse in 1204 when Crusaders from the West attacked and looted Constantinople - even though Constantinople was a Christian city! They destroyed beautiful things in Hagia Sophia and stole holy objects. The people of Constantinople never forgot this terrible betrayal.\n\nThe two churches remained separate. The Eastern Church kept its way of doing things: bishops working together, beautiful liturgy, married priests in parishes (though bishops are monks), and emphasizing becoming like God through His grace. The Western Church developed differently, emphasizing the Pope's authority and developing scholastic theology.",
          quiz: [
            {
              question: "Which issue was central to the divide in 1054?",
              options: ["Papal supremacy and the Filioque", "Use of incense", "Icon veneration", "Calendar for agriculture"],
              correctAnswer: 0
            },
            {
              question: "The year of the Great Schism is:",
              options: ["1054", "451", "787", "1453"],
              correctAnswer: 0
            },
            {
              question: "Eastern Orthodoxy emphasizes leadership as:",
              options: ["Conciliar among bishops and patriarchs", "Single universal monarch", "Hereditary priest-kings", "Democratic congregational votes"],
              correctAnswer: 0
            }
          ]
        },
        {
          id: "eo_5",
          title: "Byzantine Zenith, Hesychasm, and Fall (11th–15th c.)",
          awardPiece: "helmet_of_salvation",
          reading: "Even though the Byzantine Empire was getting weaker politically, its spiritual life reached amazing heights. Monks on Mount Athos practiced hesychasm - a special way of prayer that means 'inner stillness.' Through praying the Jesus Prayer constantly and other spiritual practices, monks said they could see the uncreated light of God - the same light that shone from Jesus on Mount Tabor when He was transfigured.\n\nA man named Barlaam didn't believe this was possible. He said God was completely unknowable and that the monks were wrong. St. Gregory Palamas, a brilliant monk and theologian, defended hesychasm. He taught that while God's essence (His inner being) is completely unknowable, His energies (His actions and grace) can be experienced. God's energies are not created things but are God Himself acting in the world. This means we really can experience God!\n\nChurch councils in 1341, 1347, and 1351 agreed with St. Gregory Palamas. This teaching became official Orthodox doctrine. It confirmed that regular Christians, not just clergy, can experience God directly. It also taught that our bodies are important in prayer and that becoming like God (theosis) is the goal of Christian life.\n\nMount Athos became the center of this teaching. This 'Holy Mountain' has been home to thousands of monks since the 900s. It still exists today with 20 main monasteries and many smaller ones, representing different Orthodox nations but united in prayer.\n\nPolitically, the Byzantine Empire kept getting smaller and weaker. The Fourth Crusade's attack in 1204 had damaged it badly. New kingdoms like Serbia and Bulgaria rose up. The Ottoman Turks slowly conquered more and more Byzantine land.\n\nOn May 29, 1453, after a two-month siege, the Ottoman Turks broke through Constantinople's walls. The last emperor, Constantine XI, died fighting bravely. The great church of Hagia Sophia became a mosque. The Byzantine Empire - which had lasted for over a thousand years - ended.\n\nBut the Orthodox Church survived! The Ottoman rulers organized Christians into a system where the Ecumenical Patriarch was responsible for all Orthodox Christians. While Christians had to pay special taxes and couldn't do everything they wanted, the Church kept the faith alive. Many martyrs died rather than deny Christ. The Church maintained its teachings and worship through centuries of Ottoman rule, showing that God's grace is stronger than any empire.",
          quiz: [
            {
              question: "Who defended hesychasm in the 14th century?",
              options: ["St. Gregory Palamas", "St. Augustine", "St. Thomas Aquinas", "St. Bernard"],
              correctAnswer: 0
            },
            {
              question: "Constantinople fell to the Ottomans in:",
              options: ["1453", "1204", "313", "988"],
              correctAnswer: 0
            },
            {
              question: "The 'Tabor Light' refers to:",
              options: ["Experience of uncreated divine energies", "A Byzantine lantern brand", "A council's candle ritual", "A palace lighthouse"],
              correctAnswer: 0
            },
            {
              question: "Which event severely weakened Byzantium prior to 1453?",
              options: ["Sack of Constantinople in 1204", "Edict of Milan", "Council of Ephesus", "Iconoclastic settlement (787)"],
              correctAnswer: 0
            }
          ]
        },
        {
          id: "eo_6",
          title: "Russia and the 'Third Rome' (15th–17th c.)",
          awardPiece: "sword_of_the_spirit",
          reading: "After Constantinople fell, Russia became the largest Orthodox country. Moscow saw itself as the 'Third Rome' - after Rome fell to heresy and Constantinople fell to the Turks, Moscow would be the new protector of Orthodox Christianity. The Russian tsars (emperors) took this role very seriously.\n\nRussia received Orthodox Christianity in 988, and it deeply shaped Russian culture. Beautiful onion-domed churches sprang up across the land. Monasteries like the Trinity-Sergius Lavra became centers of prayer and learning. Russian iconographers created masterpieces like Andrei Rublev's famous Trinity icon.\n\nIn the 1650s, Patriarch Nikon tried to reform Russian church practices to match Greek practices more closely. Some changes were about how to make the sign of the cross or how many times to say 'Alleluia.' These seem like small things, but for people who saw every detail of worship as sacred, they were huge! Many Russians refused to accept these changes and became known as Old Believers, who still exist today as a separate group.\n\nDuring this time, Orthodox Christians under Ottoman rule faced many challenges. They couldn't build new churches without special permission, had to pay extra taxes, and sometimes Christian boys were taken to become soldiers in the sultan's army. Despite all this, the Church survived and kept the faith alive. Monasteries preserved manuscripts and icons. Faithful bishops and priests served their people. Many ordinary Christians remained true to their faith despite the hardships.",
          quiz: [
            {
              question: "Why was Moscow called the 'Third Rome'?",
              options: ["Because it saw itself as the new protector of Orthodoxy", "Because it had three churches", "Because it was founded by Romans", "Because the Pope moved there"],
              correctAnswer: 0
            },
            {
              question: "What caused the Old Believer schism?",
              options: ["Liturgical reforms by Patriarch Nikon", "The fall of Constantinople", "Icon veneration disputes", "Monastic rules"],
              correctAnswer: 0
            },
            {
              question: "Who painted the famous Trinity icon?",
              options: ["Andrei Rublev", "Leonardo da Vinci", "St. Luke", "Emperor Constantine"],
              correctAnswer: 0
            }
          ]
        }
      ]
    }
  ]
};
