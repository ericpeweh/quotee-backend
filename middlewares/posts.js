// Dependencies
const badWords = require("bad-words");

const profanityFilter = new badWords({ regex: /\*|\.|$/gi });
const indonesianBadWords = [
	"Bajingan",
	"Kunyuk",
	"Asu",
	"Bangsat",
	"Kampret",
	"Kontol",
	"Memek",
	"Ngentot",
	"Ngewe",
	"Jembut",
	"Perek",
	"Pecun",
	"Bencong",
	"Banci",
	"Jablay",
	"Maho",
	"Udik",
	"Sarap",
	"Kamseupay",
	"Dajjal",
	"Jahannam",
	"Jahanam",
	"Jin Tomang",
	"Bejad",
	"Tai",
	"Taik",
	"Dajal",
	"Puki",
	"Pukimak",
	"Cuki",
	"Sundala",
	"Laso",
	"Kembeng",
	"Luji",
	"Jancok",
	"Sempak",
	"Jamput",
	"Juancok",
	"Juancokk",
	"Pantek",
	"Cukimai",
	"Bampuki",
	"Bangke",
	"Jamet",
	"Kuproy",
	"Oyot",
	"Sedeng",
	"Autis",
	"Kentung",
	"Cacad",
	"Kepet",
	"Ngepet",
	"Homo",
	"Cipay",
	"Cipai",
	"Kondom",
	"Gambris",
	"Anjrit",
	"Anjir",
	"Jancuk",
	"Tepos",
	"Kimak",
	"Qmac"
];
profanityFilter.addWords(...indonesianBadWords);
profanityFilter.removeWords("pula", "hells", "sadist", "suka");

// Middlewares
module.exports.quotesValidator = (req, res, next) => {
	const quotes = req.body.quotes;

	// Length validator
	if (quotes.length < 20 || quotes.length > 200) {
		return res
			.status(400)
			.json({ message: "Must not be less than 20 characters or more than 200 characters" });
	}

	// Profanity validator
	const currentQuotes = quotes;
	const filteredQuotes = profanityFilter.clean(quotes);

	if (currentQuotes !== filteredQuotes) {
		return res.status(400).json({ message: "Bad words is not allowed!" });
	}

	return next();
};

module.exports.tagsValidator = (req, res, next) => {
	const tags = req.body.tags;

	// Tags length validator
	if (tags.length === 0) return res.status(400).json({ message: "Must have at least 1 tag!" });
	if (tags.length > 5)
		return res.status(400).json({ message: "Only 5 tags is allowed in each post!" });

	// Profanity validator
	const tagsString = tags.join(" ");
	const filteredTags = profanityFilter.clean(tagsString);
	if (tagsString !== filteredTags) {
		return res.status(400).json({ message: "Bad words is not allowed!" });
	}

	return next();
};
