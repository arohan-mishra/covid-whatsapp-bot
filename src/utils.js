const axios = require('axios');
const outdent = require('outdent');
const fetch = require('node-fetch');
const request = require('postman-request');

const a = process.env.WHATSAPP_NUMBER;
const key = process.env.VONAGE_API_KEY;
const secret = process.env.VONAGE_API_SECRET;

// default message type will be `text`

const sendMessage = async (to, message, type = 'text') => {
	let from = {
		// either 'WhatsApp' or 'messenger'
		type: to.type,
	};

	if (to.type === 'whatsapp') {
		// the WhatsApp Sandbox number
		from.number = a;
	}

	await axios.post(
		'https://messages-sandbox.nexmo.com/v0.1/messages',
		{
			to,
			from,
			message: {
				content: {
					type,
					[type]: message,
				},
			},
		},
		{
			auth: {
				username: '5ae1bf4a',
				password: 'h4LAoSifyo0nkQue',
			},
		}
	);
};

const fixedMessages = {
	help:
		'The covid saviour bot gives you information on the availability of beds in hospitals. Also, it lets you store about the service you want to provide or use ' +
		'\n\n' +
		'You can use the following commands:\n' +
		'1. *help* / *hi* / *hello* - Get this menu and all the commands you can use\n' +
		'2. *get* count _<city_name>_\n' +
		'3. *services* - Get a list of all the services available\n' +
		'4. *add* _<service-name>_ _<name>_ _<password>_ _<contact>_ _<city>_ _<location>_ - Add your service\n' +
		'5. *delete* _<service-name>_ _<password>_ - Delete your particular service\n' +
		'6. *get* _<service-name>_ _<city>_ - Find particular service in particular city',
	services: outdent`
	    The services currently available are:

		1. Plasma Service _<service-name>_ = *plasma*
		2. Auto/Cab Service _<service-name>_ = *auto*
		3. Barbar Service _<service-name>_ = *barbar*
		4. Electrician Service _<service-name>_ = *electrician*
		5. Kirana Stores Service _<service-name>_ = *kirana*
		6. Medicine Service _<service-name>_ = *medicine*
		7. Mess / tiffin Service _<service-name>_ = *mess*
		8. Plumber Service _<service-name>_ = *plumber*
		9. Covid waste cleaning Service _<service-name>_ = *cleaner*
	  `,
};

const { encode, decode } = require('js-base64');

const getHospitalId = (encodedId) => {
	return decode(encodedId).slice(9);
};

const getEncodedString = (hospitalId) => {
	return encode(`Hospital:${hospitalId}`);
};

const getFormattedHospital = (hospital) => {
	const index = getHospitalId(hospital.id);

	const roundedString = (occupied, total) => {
		return `${Math.floor((occupied * 100) / total)}% Occupied`;
	};

	const h = hospital;

	// Percentages of beds available
	const percentages = {
		icu: roundedString(h.icuOccupied, h.icuTotal),
		hdu: roundedString(h.hduOccupied, h.icuTotal),
		oxygen: roundedString(h.oxygenOccupied, h.icuTotal),
		general: roundedString(h.generalOccupied, h.icuTotal),
		ventilators: roundedString(h.ventilatorsOccupied, h.icuTotal),
	};

	const formatted = outdent`
      *(${index}) ${hospital.name}*
        ${
					h.icuTotal !== 0 && h.icuAvailable !== null
						? `_ICU Available_: ${h.icuAvailable} (${percentages.icu})`
						: ''
				}
        ${
					h.hduTotal !== 0 && h.icuAvailable !== null
						? `_HDU Avalable_: ${h.hduAvailable} (${percentages.hdu})`
						: ''
				}
        ${
					h.oxygenTotal !== 0 && h.oxygenAvailable !== null
						? `_Oxygen Available_: ${h.oxygenAvailable} (${percentages.oxygen}})`
						: ''
				}
        ${
					h.generalTotal !== 0 && h.generalAvailable !== null
						? `_General Available_: ${h.generalAvailable} (${percentages.general})`
						: ''
				}
        ${
					h.ventilatorsTotal !== 0 && h.ventilatorsAvailable !== null
						? `_Ventilators Available_: ${h.ventilatorsAvailable} (${percentages.ventilators})`
						: ''
				}
        ${h.phone !== null ? `_Phone_: ${h.phone}` : ''}
        ${h.phone !== null ? `_Website_: ${h.website}` : ''}
    `;

	return removeEmptyLines(formatted);
};

const removeEmptyLines = (string) => {
	const lines = string.split('\n');
	const newLines = [];

	for (const line of lines) {
		// Continue if the line is a blank line
		if (line.match(/^\s*$/)) continue;
		newLines.push(line);
	}

	return newLines.join('\n');
};

const getFormattedHospitals = (hospitals) => {
	let message = '';

	for (const hospital of hospitals) {
		const formattedHospital = getFormattedHospital(hospital);
		message += formattedHospital + '\n\n';
	}

	return message;
};

const locationKey = {
	bangalore: 'bengaluru-karnataka',
	bengaluru: 'bengaluru-karnataka',
	pune: 'pune-maharashtra',
	kohlapur: 'kohlapur-maharashtra',
	sangli: 'sangli-maharashtra',
	satara: 'satara-maharashtra',
	solapur: 'solapur-maharashtra',
	anantapur: 'anantapur-andhra pradesh',
	chittoor: 'chittoor-andhra pradesh',
	'east godavari': 'east godavari-andhra pradesh',
	guntur: 'guntur-andhra pradesh',
	krishna: 'krishna-andhra pradesh',
	kurnool: 'kurnool-andhra pradesh',
	prakasam: 'prakasam-andhra pradesh',
	nellore: 'spsr nellore-andhra pradesh',
	srikakulam: 'srikakulam-andhra pradesh',
	vishakapatanam: 'vishakapatanam-andhra pradesh',
	vizianagaram: 'vizianagaram-andhra pradesh',
	'west godavari': 'west godavari-andhra pradesh',
	kadapa: 'kadapa-andhra pradesh',
};

function get(callback) {
	try {
		fetch('https://api.rootnet.in/covid19-in/hospitals/medical-colleges')
			.then((res) => {
				if (res.status >= 200) return res.json();
				else throw Error();
			})
			.then((data) => {
				callback(
					data.data.medicalColleges.map(
						(city) =>
							'*' +
							city.city +
							', ' +
							city.state +
							'* \n' +
							'Name of Hospital: ' +
							'*' +
							city.name +
							'*' +
							'\n' +
							'Admission Capacity: ' +
							city.admissionCapacity +
							'\n' +
							'Total No Of Hospital Beds: ' +
							city.hospitalBeds +
							'\n' +
							'Owned by ' +
							city.ownership +
							'\n'
					)
				);
			});
	} catch {}
}

module.exports = {
	fixedMessages,
	sendMessage,
	locationKey,
	getFormattedHospitals,
	get,
};
