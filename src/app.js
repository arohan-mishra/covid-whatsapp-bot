'use strict';

const express = require('express');
const fetch = require('node-fetch');
const path = require('path');
const fs = require('fs');

const Request = require('request');
require('dotenv').config();
const req = require('postman-request');

console.log('get count pune'.split(' ')[2]);

const {
	fixedMessages,
	sendMessage,
	locationKey,
	getFormattedHospitals,
	get,
} = require('./utils');

console.log(fixedMessages.help);
const { GraphQLClient } = require('graphql-request');
const client = new GraphQLClient('https://bedav.org/graphql');

const app = express();
app.use(express.json());

const handleInbound = async (request, response) => {
	const content = request.body.message.content;

	const text = content.text;

	// whom we have to reply to
	const to = request.body.from;

	const searchRegex = /^search .* in .*$/i;
	const directionsRegex = /^get directions to .*/i;

	if (text.match(searchRegex)) {
		handleSearch(text, to);
	} else if (text.match(directionsRegex)) {
		handleDirections(text, to);
	} else if (['help', 'hi', 'hello'].includes(text)) {
		sendMessage(to, fixedMessages.help);
	} else if (text === 'services') {
		sendMessage(to, fixedMessages.services);
	} else if (text === 'send this') sendMessage(to, text);
	else if (text.includes('get count')) {
		const getCities = get((getCities) => {
			let str = '';
			let sendInfo = '';
			let location = '';
			for (let i = 0; i < getCities.length; i++) {
				if (getCities[i].includes(text.split(' ')[2])) {
					console.log(getCities[i].split('\n')[1].split(': ')[1]);
					sendInfo += getCities[i] + '\n';
				}
			}
			sendMessage(to, sendInfo);
			return;
		});
	} else if (text.includes('add auto')) {
		const autos = require('./auto.json');
		const t = 'This password is taken, please try with a different one';
		const t1 = 'Your serice is added.';
		let auto = {
			name: text.split(' ')[2],
			password: text.split(' ')[3],
			contact: text.split(' ')[4],
			city: text.split(' ')[5],
			location: text.substring(text.indexOf(text.split(' ')[6])),
		};
		let temp = 0;
		autos.forEach((element) => {
			if (element.password === auto.password) {
				temp++;
				return;
			}
		});
		if (temp === 0) autos.push(auto);
		else sendMessage(to, t);

		const data = JSON.stringify(autos, null, 2);
		fs.writeFile(path.join(__dirname, 'auto.json'), data, () => {});
		sendMessage(to, t1);
	} else if (text.includes('add plasma')) {
		const t = 'Your plasma service is added. Thank You.';
		const plasmas = require('./plasma.json');
		const t1 = 'Sorry, this password has already been taken';
		let plasma = {
			name: text.split(' ')[2],
			password: text.split(' ')[3],
			contact: text.split(' ')[4],
			city: text.split(' ')[5],
			location: text.substring(text.indexOf(text.split(' ')[6])),
		};

		let tempP = 0;
		plasmas.forEach((element) => {
			if (element.password === plasma.password) {
				tempP++;
				sendMessage(to, t1);
			}
		});
		if (tempP === 0) plasmas.push(plasma);
		const data = JSON.stringify(plasmas, null, 2);
		fs.writeFile(path.join(__dirname, 'plasma.json'), data, () => {});

		sendMessage(to, t);
	} else if (text.includes('get auto')) {
		const rawData = fs.readFileSync(path.join(__dirname, 'auto.json'));
		const autoInfo = JSON.parse(rawData);
		let str = '';
		autoInfo.map((auto) => {
			if (auto.city === text.split(' ')[2])
				str +=
					'Name: ' +
					auto.name +
					'\n' +
					'Contact No: ' +
					auto.contact +
					'\n' +
					'Location: ' +
					auto.location +
					'\n' +
					'\n';
		});
		if (text.includes('get auto')) sendMessage(to, str);
		return;
	} else if (text.includes('get plasma')) {
		const rawData = fs.readFileSync(path.join(__dirname, 'plasma.json'));
		const autoInfo = JSON.parse(rawData);
		let strP = '';
		autoInfo.map((plasma) => {
			if (plasma.city === text.split(' ')[2])
				strP +=
					'Name: ' +
					plasma.name +
					'\n' +
					'Contact No: ' +
					plasma.contact +
					'\n' +
					'Location: ' +
					plasma.location +
					'\n' +
					'\n';
		});
		if (text.includes('get plasma')) sendMessage(to, strP);
		return;
	} else if (text.includes('delete auto')) {
		const temp = 'Your service has been deleted';
		const autos = require('./auto.json');
		let tempAuto = [];
		autos.map((aut) => {
			if (aut.password !== text.split(' ')[2]) {
				tempAuto.push(aut);
			}
		});
		const data = JSON.stringify(tempAuto, null, 2);
		fs.writeFile(path.join(__dirname, 'auto.json'), data, () => {
			sendMessage(to, `Your service is deleted.`);
		});
	} else if (text.includes('delete plasma')) {
		const temp = 'Your service has been deleted';
		const plasmas = require('./plasma.json');
		let tempPlasma = [];
		plasmas.map((pla) => {
			if (pla.password !== text.split(' ')[2]) {
				tempPlasma.push(pla);
			}
		});
		const data = JSON.stringify(tempPlasma, null, 2);
		fs.writeFile(path.join(__dirname, 'plasma.json'), data, () => {
			sendMessage(to, `Your service is deleted.`);
			console.log(plasmas);
		});
	} else {
		sendMessage(
			to,
			`Sorry, invalid message. Type *help* to get a list of all commands.`
		);
	}

	response.status(200).end();
};

app.post('/webhooks/inbound', handleInbound);

app.post('/webhooks/status', (request, response) => {
	console.log(request.body);
	response.status(200).end();
});

const handleSearch = async (message, to) => {
	// extract the search query and location from the message
	const searchRegex = /^search (?<searchQuery>[a-zA-Z0-9_ ]+) in (?<location>[a-zA-Z0-9_ ]+)$/i;
	const match = searchRegex.exec(message);

	if (match === null) {
		sendMessage(
			to,
			'Please enter the hospital name you want to search for and the location'
		);
		return;
	}

	const {
		groups: { searchQuery, location },
	} = match;

	if (!Object.keys(locationKey).includes(location)) {
		sendMessage(
			to,
			'Invalid location entered. Type *cities* to look at all the cities available'
		);
		return;
	}

	try {
		const data = await client.request(searchGraphQLQuery, {
			location: locationKey[location],
			query: searchQuery,
		});

		const { edges } = data.locality.hospitals;
		const hospitals = edges.map((item) => item.node);

		if (edges.length === 0) {
			sendMessage(
				to,
				'Sorry, there were no hospitals that matched your search 🙁'
			);
			return;
		}

		const formattedMessage = getFormattedHospitals(hospitals);
		sendMessage(to, formattedMessage);
	} catch (error) {
		sendMessage(
			to,
			'Sorry, there were no hospitals that matched your search 🙁'
		);
	}
};

const handleDirections = async (message, to) => {
	const directionsRegex = /^get directions to (?<hospitalId>\d+)$/i;
	const match = directionsRegex.exec(message);

	if (match === null) {
		sendMessage(to, 'Please enter a valid Hospital ID');
		return;
	}

	const hospitalId = getEncodedString(parseInt(match.groups.hospitalId));

	try {
		const { hospital } = await client.request(directionsGraphQLQuery, {
			id: hospitalId,
		});

		if (to.type === 'whatsapp') {
			sendMessage(
				to,
				{
					type: 'location',
					location: {
						longitude: hospital.longitude,
						latitude: hospital.latitude,
						name: hospital.name,
						address: hospital.address,
					},
				},
				'custom'
			);
		} else {
			const link = `https://maps.google.com/maps?q=${hospital.latitude},${hospital.longitude}`;
			const message = `${link}\n*${hospital.name}*\n${hospital.address}\n`;

			sendMessage(to, message);
		}
	} catch (error) {
		sendMessage(to, 'Please enter a valid Hospital ID');
	}
};

app.listen(3000, () => {
	console.log('Listening on port 3000');
});
