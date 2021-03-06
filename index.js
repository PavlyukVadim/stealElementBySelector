'use strict';

const url = require('url');
const cheerio = require('cheerio');
const requestPromise = require('request-promise');

const siteLink = 'http://966402.sqdev.web.hosting-test.net/';
const cssHref = 'http://sqdev.cc/node_modules/bulma/css/bulma.css';
const selector = 'img';



function getElementsBySelector(siteLink, selector) {
  const options = {
    uri: siteLink,
    transform: function (body) {
      return cheerio.load(body);
    }
  };
  const arrayOfSelectors = [];
  let uniqueArrayOfSelectors = [];

  return new Promise( function( resolve, reject ) {
    requestPromise(options)
      .then(($) => {
          let element = $(selector)
          getChildElements(element[0], arrayOfSelectors);
          uniqueArrayOfSelectors = arrayOfSelectors.filter((item, i, arr) => arr.indexOf(item) === i);
          console.log(uniqueArrayOfSelectors);
      })
      .catch((reason) => console.log('Reason:', reason));
  })
}

getElementsBySelector(siteLink, '#slider-2 .container .row div h2');
//#slider-2 .container .row div h2

function getSelectorsByElement(element, selectors) {
  selectors.push(element.name)
  if (element.attribs.id) {
    selectors.push(`#${element.attribs.id}`)
  }
  if (element.attribs.class) {
    selectors.push(...element.attribs.class.split(' ').map((className) => `.${className}`));
  }
}


function getChildElements(element, selectors) {
  if (!element) return;
  getSelectorsByElement(element, selectors)
  let children = element.children.filter((element) => element.type === 'tag');
  children.forEach((child) => getChildElements(child, selectors));
}


function getArrayOfCssLinks(siteLink) {
  const options = {
    uri: siteLink,
    transform: function (body) {
      return cheerio.load(body);
    }
  };
  return new Promise( function( resolve, reject ) {
    requestPromise(options)
      .then(($) => {
          let cssLinks = $('link').toArray()
            //.filter(link => link.attribs.type === 'text/css')
            .map(link => link.attribs.href);
          resolve(cssLinks); 
      })
      .catch((reason) => console.log('Reason:', reason));
  }) 
}


function getStyleFromSite(siteLink) {
  Promise.resolve()
    .then(() => getArrayOfCssLinks(siteLink))
    .then((links) => linksValidation(siteLink, links))
    //.then((links) => console.log(links))
    .then((links) => getStylesByLink(cssHref, 'img'))


}


function linksValidation(siteLink, links) {
  return links.map((link) => {
    if (!link.includes('http')) return siteLink + link;
    return link; 
  });
}


function getStylesByLink(cssLink, selector) {
  const options = {
    uri: cssLink
  }

  requestPromise(options)
    .then((body) => ('}' + body))
    .then((body) => parseCss(body, selector))
    .catch((reason) => console.log('Reason:', reason));
}


function parseCss(body, basicSelector) {
  let regexp = new RegExp(`([\n ,s])+${basicSelector}[ wsd.#,-]*[{,]{1}`, 'gi');
  let result;

  while (result = regexp.exec(body)) {
    let indexOfBracket = body.lastIndexOf('}', result.index) + 1;
    let indexOfСomma = body.lastIndexOf(',', result.index) + 1; 
    let startIndexOfSelector = indexOfBracket > indexOfСomma ? indexOfBracket : indexOfСomma;
    let lastIndexOfSelector = regexp.lastIndex;

    let selector = body.slice(startIndexOfSelector, lastIndexOfSelector - 1).trim();

    let startIndexOfStyles = body.indexOf('{', regexp.lastIndex - 1);
    let lastIndexOfStyles = body.indexOf('}', regexp.lastIndex) + 1;

    let styles = body.slice(startIndexOfStyles, lastIndexOfStyles);
   
    console.log(selector, styles);
  }
}

//getStyleFromSite(siteLink);
