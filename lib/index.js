// Copyright (c)2025 Quinn Michaels; All rights reserved.
// Distributed under the MIT software license, see the accompanying
// file LICENSE.md or http://www.opensource.org/licenses/mit-license.php.
import path from 'path';
import fs from 'fs';
import os from 'os';

import { createHash, randomUUID, createCipheriv, createDecipheriv, randomBytes } from 'crypto';

class Node {
	constructor(opts) {
		for (let opt in opts) this[opt] = opts[opt];
	}
}
class LIB {
	constructor(opts) {
		this.lang = opts.lang || 'en';
		this.locale = opts.locale || 'en-US';
		this.currency = opts.currency || 'USD';
		this.os = os;
		this.fs = fs;
		this.path = path;
		
	}

	help(msg, help_dir) {
		return new Promise((resolve, reject) => {
			const params = msg.split(' ');
			let helpFile = 'main';
			if (params[0]) helpFile = params[0];
			if (params[1]) helpFile = `${params[0]}_${params[1]}`;
			helpFile = path.join(help_dir, 'help', `${helpFile}.feecting`);
			try {
				return resolve(fs.readFileSync(helpFile, 'utf8'))
			} catch (e) {
				return reject(e)
			}
		})
	}


	/**************
	func: uid
	params:
		- guid: This is a true false flag for generating a guid.
	describe:
		The uid function can create two types of id for you.
		1. random GUID - this is good for when you need a uinique record id returned
		2. transport id - The transport id is a number generated to provide a
											numerical number used for transporting records to places
											like social networks, email, other networks where informaton
											is shared.
	***************/
	uid(guid=false) {
		let id;
		if (guid) {
			id = randomUUID()
		}
		else {
			const min = Math.floor(Date.now() - (Date.now() / Math.PI));
			const max = Math.floor(Date.now() + (Date.now() * Math.PI));
			id = Math.floor(Math.random() * (max - min)) + min;
		}
		return id;
	}

	/**************
	func: hash
	params:
		- texts: The text string to create a hash value for.
		- algo: The hashing algorithm to use for hashing. md5, sha256, or sha512
	
	describe:
		The hash algorithm will take a string of text and produce a hash.
	***************/
	hash(str, algo=false) {
		algo = algo || 'md5';
		const the_hash = createHash(algo);
		the_hash.update(JSON.stringify(str));
		const _digest = the_hash.digest('base64');
		return `${algo}-${_digest}`;
	}

	/**************
	func: cipher
	params: str - string to encrypt
	describe:
		The encrypt function allows for the internal encryption of data based on the
		defined client security settings.
	***************/
	cipher(str, opts) {
		const {password, algorithm} = opts;
		const key = createHash('sha256').update(String(password)).digest('base64');
		const key_in_bytes = Buffer.from(key, 'base64')
		const iv = randomBytes(16);
		// create a new cipher
		const _cipher = createCipheriv(algorithm, key_in_bytes, iv);
		const encrypted = _cipher.update(String(str), 'utf8', 'hex') + _cipher.final('hex');
	
		return {
			iv: iv.toString('base64'),
			key,
			encrypted,
		}
	}

	decipher(opt) {
		const iv = Buffer.from(opt.iv, 'base64');
		const encrypted = Buffer.from(opt.encrypted, 'hex');
		const key_in_bytes = Buffer.from(opt.key, 'base64')
		const decipher = createDecipheriv( 'aes-256-cbc', key_in_bytes, iv);
		const decrypted = decipher.update(encrypted);
		const final = Buffer.concat([decrypted, decipher.final()]);
		return final.toString();
		this.state('return', 'decipher');
	}

	/**************
	func: copy
	params: obj
	describe:
		a simple copy object to create a memory clean copy of data to
		prevent collisions when needed. Handles clean text, array, object copy.
		it makes the assumption tha the user is submitting either an array or object
		for copying.
	***************/
	copy(obj) {
		return JSON.parse(JSON.stringify(obj));
	}

	/**************
	func: getToday
	params:
		- d: The date string to get the day of..
	describe:
		a date can be passed in or generated to produce a date string for the day
		where time is 0. This feature is useful for logging for getting a date
		with no time value for the current day.
	***************/
	getToday(d) {
		d = d ? d : Date.now();
		const today = new Date(d);
		today.setHours(0);
		today.setMinutes(0);
		today.setSeconds(0);
		today.setMilliseconds(0);
		return today.getTime();
	}

	/**************
	func: formatDate
	params:
		- d: The date string to format.
		- format: the various formats that can be selected.
		- time: boolean flag to include the time stampt iwth the date.
		- locale: The locale formatting of the date to return.
	describe:
		formats: long, long_month, short, short_month, year, month, day
		FDate format ensures that consistent date formatting is used within the
		system based on the language and locale in the client profile.
	***************/
	formatDate(d, format='milli', time=false) {
		if (!d) d = Date.now();
		d = new Date(d);
	
		if (format === 'milli') return d.getTime();
		// pre-set date formats for returning user dates.
		const formats = {
			long: { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' },
			long_month: { year: 'numeric', month: 'long', day: 'numeric'},
			short: { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' },
			short_month: { year: 'numeric', month: 'short', day: 'numeric' },
			numeric: { year: 'numeric', month: 'numeric', day: 'numeric' },
			year: { year: 'numeric' },
			month: { month: 'long' },
			day: { day: 'long' },
			log: { year: 'numeric', month: 'short', day: 'numeric' },
		};
		const theDate = d.toLocaleDateString(this.locale, formats[format]);
		const theTime = time ? this.formatTime(d) : false;
		return !theTime ? theDate : `${theDate} - ${theTime}`;
	}

	/**************
	func: formatTime
	params:
		- t: the time to format
	describe:
		The formatTime fucntion will return a consistent local time for the t
		parameter based on the locale setting in the client profile..
	***************/
	formatTime(t) {
		return t.toLocaleTimeString(this.locale);     // return the formatted time string
	}
	
	/**************
	func: formatCurrency
	params:
		- n: is the number that you want to return the currency of.
	describe:
		The formatCurrency function will format a currency value based on the setting
		in the client profile.
	***************/
	formatCurrency(n, cur=false) {
		const currency = cur || this.currency;
		return new Intl.NumberFormat(this.locale, { style: 'currency', currency: currency }).format(n);
	}
	
	/**************
	func: formatCurrency
	params:
		- n: is the number that you want to return the currency of.
	describe:
		The formatCurrency function will format a currency value based on the setting
		in the client profile.
	***************/
	formatNumber(n) {
		return new Intl.NumberFormat(this.locale).format(n);
	}
	
	/**************
	func: formatPercent
	params:
		- n: is the number that you want to format as a percent.
		- dec: is the number of decimal places to apply to the number.
	describe:
	***************/
	formatPercent(n, dec=2) {
		return parseFloat(n).toFixed(dec) + '%';
	}
	
	/**************
	func: trimWords
	params:
		- text: The text to trim.
		- maxwords: The number of words to max.
	describe:
		A utility function to trimText intput to a specific word count.
	***************/
	trimWords(text, maxwords) {
		const splitter = text.split(' ');
		if (splitter < maxwords) return text;
		return splitter.slice(0, maxwords).join(' ');
	}
	
	/**************
	func: dupes
	params: dupers
	describe: remove duplicees from an array.
	***************/
	dupes(dupers) {
		if (!Array.isArray(dupers)) return dupers;
		const check = [];
		return dupers.filter(dupe => {
			if (!check.includes(dupe)) {
				check.push(dupe);
				return dupe;
			}
		});
	}	
};
export default LIB
