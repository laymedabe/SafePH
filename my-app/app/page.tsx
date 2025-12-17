'use client';

import React, { useEffect, useState, ReactNode, useRef } from 'react';
import {
  AlertTriangle,
  Phone,
  MapPin,
  Bell,
  Search,
  MessageSquare,
  Menu,
  X,
  Home,
  Book,
  Shield,
  Settings,
  History,
  Clock,
  XCircle,
  PlayCircle,
} from 'lucide-react';
import type * as Leaflet from 'leaflet';
import Image from "next/image";

// ---------- Types ----------

type GuideStep = {
  stepNumber: number;
  title: string;
  description: string;
};

type FirstAidGuide = {
  id: string;
  title: string;
  category: 'Critical' | 'Injury' | 'Disaster' | 'Medical';
  updated: string;
  shortDescription: string;
  fullDescription: string;
  steps: GuideStep[];
  thumbnail: string;
  videoUrl: string;
};

type EmergencyHistoryItem = {
  icon: React.ComponentType<{ className?: string; size?: number }>;
  time: ReactNode;
  id: number;
  type: string;
  date: string;
  location: string;
  status: string;
  responders: string;
  color: 'red' | 'blue' | 'green' | 'orange';
  createdAt: string;
  category: 'sos' | 'call' | 'disaster' | 'other';
};

type GuideHistoryItem = {
  id: number;
  guideId: string;
  guideTitle: string;
  viewedAt: string;
  createdAt: string;
};

type HistoryEventKind = 'sos' | 'call' | 'disaster' | 'guide' | 'other';

type HistoryEvent = {
  id: number;
  kind: HistoryEventKind;
  icon: React.ComponentType<{ className?: string; size?: number }>;
  title: string;
  description?: string;
  date: string;
  location?: string;
  status?: string;
  responders?: string;
};

type Language = 'en' | 'tl' | 'ceb';

// ---------- Translations ----------
// All user-facing strings go here so language switch affects the whole UI. [web:24][web:40]

const translations: Record<Language, Record<string, string>> = {
  en: {
    appTitle: 'SafePH',
    appSubtitle: 'A Nationwide Emergency Response Application',

    // Tabs
    tabHome: 'Home',
    tabGuides: 'Guides',
    tabMap: 'Map',
    tabHistory: 'History',
    tabSettings: 'Settings',

    // Home
    home_sos: 'SOS',
    home_sending: 'SENDING...',
    home_alertSentTitle: '🚨 Emergency Alert Sent',
    home_alertSentBody:
      'SMS, push notification, and location shared with emergency contacts (simulation)',
    home_shareLocationTitle: 'Share Location',
    home_shareLocationBody: 'Live GPS tracking (simulation)',
    home_disasterAlertsTitle: 'Disaster Alerts',
    home_disasterAlertsBody: 'Real-time updates (simulation)',
    home_lastSharedLocation: 'Last shared location',
    home_latestDisasterAlerts: 'Latest Disaster Alerts',
    home_quickDial: 'Quick Dial',
    home_call: 'Call',

    // Generic geolocation messages
    geo_notSupported: 'Geolocation is not supported on this device.',
    geo_unableLocation: 'Unable to get your location.',
    geo_unableLocationAlerts: 'Unable to get your location for alerts.',

    // Alerts fetch
    alerts_noActive: 'No active alerts for your area right now.',
    alerts_loaded: 'Latest disaster alerts loaded from OpenWeather.',
    alerts_failed: 'Failed to load disaster alerts from server.',

    // SOS
    sos_sent: 'SOS sent to emergency contacts.',

    // Guides
    guides_title: 'First Aid Guides',
    guides_subtitle:
      'Tap a guide to view detailed steps and watch a short video. This information is general first aid advice and does not replace professional medical training.',
    guides_searchPlaceholder: 'Search guides (e.g. CPR, burns, fracture)...',
    guides_showing: 'Showing',
    guides_of: 'of',
    guides_guides: 'guides',
    guides_none:
      'No guides found. Try another keyword like "CPR", "burns", or "fracture".',
    guides_updated: 'Updated',
    guides_stepTitle: 'Step-by-step guide',
    guides_thumbHint: 'Tap the thumbnail to open the full video on YouTube.',
    guides_step: 'Step',

    // Map
    map_title: 'Maps & Routes',
    map_subtitle: 'Live map with your current location',
    map_evacRoutesTitle: 'Evacuation Routes',
    map_evacRoutesBody: 'Use this map to find the nearest safe zones and shelters.',
    map_hazardTitle: 'Hazard Overlay',
    map_hazardBody: 'Extend this view later with weather and flood overlays.',

    // History
    history_title: 'Emergency History',
    history_subtitle: 'Track all your emergency interactions',
    history_sosAlerts: 'SOS Alerts',
    history_totalEvents: 'Total Events',
    history_resolvedPercent: 'Resolved',
    history_filter_all: 'All',
    history_filter_sos: 'SOS Alerts',
    history_filter_calls: 'Calls',
    history_filter_disaster: 'Disaster Alerts',
    history_none: 'No history events yet.',
    history_guidePrefix: 'Guide:',
    history_respondersPrefix: 'Responders:',

    // Settings
    settings_title: 'Settings',
    settings_subtitle: 'Tweak your SafePH experience',
    settings_emergencyContacts: 'Emergency Contacts',
    settings_updateContacts: 'Update your emergency numbers',
    settings_editNumbers: 'Edit Numbers',
    settings_language: 'Language',
    settings_languageDesc: 'Switch app language',
    settings_about: 'About SafePH',
    settings_aboutDesc: 'A simple emergency companion app for the Philippines',
    settings_version: 'Version 1.0.0',
    settings_feedback: 'Send Feedback',
    settings_feedbackDesc: 'Tell us what to improve',
    settings_feedbackBtn: 'Send Feedback',
    settings_lang_english: 'English',
    settings_lang_tagalog: 'Tagalog',
    settings_lang_cebuano: 'Cebuano',

    // ----- CPR (from your previous version) -----
    guide_cpr_title: 'CPR Guidelines',
    guide_cpr_short:
      'Recognize cardiac arrest and start chest compressions immediately while waiting for emergency responders.',
    guide_cpr_full:
      'CPR (cardiopulmonary resuscitation) is used when someone has no signs of life or is not breathing normally. The goal is to keep blood and oxygen flowing to the brain and vital organs until advanced care arrives.',
    guide_cpr_step1_title: 'Check responsiveness and breathing',
    guide_cpr_step1_desc:
      'Tap the person and shout. If there is no response and they are not breathing normally or only gasping, call emergency services.',
    guide_cpr_step2_title: 'Call for help',
    guide_cpr_step2_desc:
      'Dial your local emergency number (e.g., 911 or 143) or ask someone nearby to call while you start CPR.',
    guide_cpr_step3_title: 'Start chest compressions',
    guide_cpr_step3_desc:
      'Place the heel of one hand in the center of the chest, put your other hand on top, and press hard and fast at about 100–120 compressions per minute.',
    guide_cpr_step4_title: 'Give rescue breaths (if trained)',
    guide_cpr_step4_desc:
      'After 30 compressions, tilt the head back, lift the chin, pinch the nose, and give 2 breaths, watching for chest rise.',
    guide_cpr_step5_title: 'Continue until help arrives',
    guide_cpr_step5_desc:
      'Do not stop CPR unless the person starts breathing normally, trained help takes over, or you are physically unable to continue.',

    // ----- Choking -----
    guide_choking_title: 'Choking (Adult & Child)',
    guide_choking_category: 'Critical',
    guide_choking_updated: '3 days ago',
    guide_choking_short:
      'Recognize choking and use back blows and abdominal thrusts to clear the airway.',
    guide_choking_full:
      'Choking happens when an object blocks the airway so that air cannot reach the lungs. Quick, firm back blows and abdominal thrusts can help expel the object before the person becomes unresponsive.',
    guide_choking_step1_title: 'Confirm severe choking',
    guide_choking_step1_desc:
      'Ask “Are you choking?” A person with severe choking usually cannot speak, cough, or breathe, and may clutch their throat.',
    guide_choking_step2_title: 'Give back blows',
    guide_choking_step2_desc:
      'Stand slightly behind and to the side. Support the chest and give up to 5 sharp back blows between the shoulder blades with the heel of your hand.',
    guide_choking_step3_title: 'Give abdominal thrusts',
    guide_choking_step3_desc:
      'If the object does not come out, stand behind the person, place a fist above the navel, grasp it with your other hand, and pull inward and upward up to 5 times.',
    guide_choking_step4_title: 'Alternate until clear or collapse',
    guide_choking_step4_desc:
      'Alternate 5 back blows and 5 abdominal thrusts until the object is expelled or the person becomes unresponsive.',
    guide_choking_step5_title: 'If unresponsive, start CPR',
    guide_choking_step5_desc:
      'Gently lower them to the ground, call emergency services, and start CPR. Check the mouth for visible objects before breaths.',

    // ----- Severe Bleeding -----
    guide_bleeding_title: 'Severe Bleeding & Cuts',
    guide_bleeding_category: 'Injury',
    guide_bleeding_updated: '1 day ago',
    guide_bleeding_short:
      'Control bleeding quickly with direct pressure and keep the person calm while help is on the way.',
    guide_bleeding_full:
      'Severe bleeding can be life‑threatening if not controlled quickly. Applying firm pressure with a clean cloth or bandage and keeping the injured area elevated can slow blood loss until professionals arrive.',
    guide_bleeding_step1_title:
      'Ensure scene safety and protect yourself',
    guide_bleeding_step1_desc:
      'Check that it is safe to approach. If available, wear gloves or use a plastic barrier to reduce contact with blood.',
    guide_bleeding_step2_title: 'Apply direct pressure',
    guide_bleeding_step2_desc:
      'Place a clean cloth, gauze, or bandage directly over the wound and press firmly with your hand.',
    guide_bleeding_step3_title: 'Maintain continuous pressure',
    guide_bleeding_step3_desc:
      'Do not remove cloths that become soaked; add more layers on top and continue pressing.',
    guide_bleeding_step4_title: 'Elevate if possible',
    guide_bleeding_step4_desc:
      'If there is no suspected fracture, raise the injured limb above heart level to help slow bleeding.',
    guide_bleeding_step5_title: 'Seek urgent medical help',
    guide_bleeding_step5_desc:
      'Call emergency services if bleeding is heavy, spurting, or does not slow with pressure, or if the wound is deep or large.',

    // ----- Burns -----
    guide_burns_title: 'Burns and Scalds',
    guide_burns_category: 'Injury',
    guide_burns_updated: '3 days ago',
    guide_burns_short:
      'Cool the burn with running water, remove tight items, and avoid home remedies like oil or toothpaste.',
    guide_burns_full:
      'Burns can be caused by heat, flames, hot liquids, electricity, or chemicals. Immediate cooling with cool running water reduces pain and tissue damage and lowers the risk of complications.',
    guide_burns_step1_title: 'Stop the burning source',
    guide_burns_step1_desc:
      'Turn off heat or electricity if safe, move the person away from the source, and remove any smoldering clothing or jewelry near the burn.',
    guide_burns_step2_title: 'Cool the burn',
    guide_burns_step2_desc:
      'Hold the burned area under cool (not icy) running water for at least 20 minutes or apply cool, wet compresses.',
    guide_burns_step3_title: 'Protect the area',
    guide_burns_step3_desc:
      'Cover the burn loosely with a sterile, non‑stick dressing or clean cloth. Do not break blisters.',
    guide_burns_step4_title: 'Avoid creams and home remedies',
    guide_burns_step4_desc:
      'Do not apply butter, oil, toothpaste, or ice directly to the burn, as these can worsen damage.',
    guide_burns_step5_title: 'Get medical care for serious burns',
    guide_burns_step5_desc:
      'Seek urgent help for burns on the face, hands, feet, genitals, large areas of the body, or any deep, electrical, or chemical burns.',

    // ----- Fracture -----
    guide_fracture_title: 'Broken Bones (Fractures)',
    guide_fracture_category: 'Injury',
    guide_fracture_updated: '1 day ago',
    guide_fracture_short:
      'Immobilize the injured area and prevent further movement until professional help is available.',
    guide_fracture_full:
      'Fractures can result from falls, accidents, or direct impact. Proper first aid reduces pain and prevents the broken bone from causing more damage to surrounding tissues.',
    guide_fracture_step1_title: 'Check for open wounds and deformity',
    guide_fracture_step1_desc:
      'Look for swelling, bruising, or unnatural angle of the limb. Do not try to straighten a deformed bone.',
    guide_fracture_step2_title: 'Immobilize the area',
    guide_fracture_step2_desc:
      'Use a splint, rolled magazine, or board to keep the limb from moving. Secure above and below the injury.',
    guide_fracture_step3_title: 'Apply cold pack',
    guide_fracture_step3_desc:
      'Place a cloth‑wrapped ice pack on the area for up to 20 minutes to reduce swelling and pain.',
    guide_fracture_step4_title: 'Monitor for shock',
    guide_fracture_step4_desc:
      'Have the person lie down, keep them warm, and watch for pale, cool, or clammy skin or confusion.',
    guide_fracture_step5_title: 'Seek medical care immediately',
    guide_fracture_step5_desc:
      'Transport the person to the nearest emergency department or call for an ambulance if movement is unsafe or pain is severe.',

    // ----- Sprains & Strains -----
    guide_sprain_title: 'Sprains and Strains',
    guide_sprain_category: 'Injury',
    guide_sprain_updated: '4 days ago',
    guide_sprain_short:
      'Use the RICE method: rest, ice, compression, and elevation to manage common joint injuries.',
    guide_sprain_full:
      'Sprains affect ligaments, while strains affect muscles or tendons. Many mild sprains and strains can be safely managed at home initially using rest, ice, compression, and elevation.',
    guide_sprain_step1_title: 'Rest the injured area',
    guide_sprain_step1_desc:
      'Stop the activity and avoid putting weight or strain on the injured limb or joint.',
    guide_sprain_step2_title: 'Apply ice',
    guide_sprain_step2_desc:
      'Place a cold pack or wrapped ice on the area for 15–20 minutes every 2–3 hours during the first day.',
    guide_sprain_step3_title: 'Use compression',
    guide_sprain_step3_desc:
      'Wrap the area with an elastic bandage, snug but not so tight that it causes numbness or tingling.',
    guide_sprain_step4_title: 'Elevate the limb',
    guide_sprain_step4_desc:
      'Raise the injured part above the level of the heart to reduce swelling.',
    guide_sprain_step5_title: 'Seek medical review if needed',
    guide_sprain_step5_desc:
      'Get checked if pain is severe, you cannot use the joint, or there is deformity or suspected fracture.',

    // ----- Head Injury -----
    guide_head_title: 'Head Injury & Concussion',
    guide_head_category: 'Injury',
    guide_head_updated: '5 days ago',
    guide_head_short:
      'Watch for confusion, vomiting, or worsening headache after a blow to the head and seek urgent care if present.',
    guide_head_full:
      'Head injuries can range from minor bumps to serious brain injuries. Any loss of consciousness, confusion, repeated vomiting, or worsening symptoms require urgent medical assessment.',
    guide_head_step1_title: 'Check responsiveness',
    guide_head_step1_desc:
      'Talk to the person, ask simple questions, and see if they respond normally.',
    guide_head_step2_title: 'Look for danger signs',
    guide_head_step2_desc:
      'Watch for confusion, repeated vomiting, severe or worsening headache, seizures, weakness, or unequal pupils.',
    guide_head_step3_title: 'Keep them still',
    guide_head_step3_desc:
      'Have the person lie down and avoid moving their neck if there is any concern for neck or spine injury.',
    guide_head_step4_title: 'Apply cold pack to bumps',
    guide_head_step4_desc:
      'For minor bumps, gently apply a cold pack wrapped in cloth to reduce swelling.',
    guide_head_step5_title: 'Seek medical care',
    guide_head_step5_desc:
      'Call emergency services or go to the hospital if any danger signs are present or if symptoms do not improve.',

    // ----- Hypothermia -----
    guide_hypo_title: 'Hypothermia & Cold Exposure',
    guide_hypo_category: 'Medical',
    guide_hypo_updated: '2 weeks ago',
    guide_hypo_short:
      'Warm the person gradually, remove wet clothing, and seek help if there is confusion or drowsiness.',
    guide_hypo_full:
      'Hypothermia occurs when body temperature drops too low, often from wet or cold environments. Slow, gentle rewarming and prompt medical care prevent serious complications.',
    guide_hypo_step1_title: 'Move to a warm, dry place',
    guide_hypo_step1_desc:
      'Shelter the person from wind and cold and remove any wet clothing, replacing it with dry layers.',
    guide_hypo_step2_title: 'Warm the body gradually',
    guide_hypo_step2_desc:
      'Use blankets, warm clothing, or body heat. Focus on warming the chest, neck, and head first.',
    guide_hypo_step3_title: 'Offer warm drinks if alert',
    guide_hypo_step3_desc:
      'If fully awake and able to swallow, give warm, sweet, non‑alcoholic drinks.',
    guide_hypo_step4_title: 'Avoid direct intense heat',
    guide_hypo_step4_desc:
      'Do not use very hot water, heating pads, or rub the skin vigorously, as this can cause problems.',
    guide_hypo_step5_title: 'Seek medical care',
    guide_hypo_step5_desc:
      'Call emergency services if there is confusion, drowsiness, slow breathing, or if improvement is not rapid.',

    // ----- Drowning -----
    guide_drowning_title: 'Drowning & Near‑Drowning',
    guide_drowning_category: 'Critical',
    guide_drowning_updated: '2 weeks ago',
    guide_drowning_short:
      'Ensure safety, remove from water if possible, start CPR if not breathing, and call emergency services.',
    guide_drowning_full:
      'Drowning can happen quickly and quietly. Safe rescue, immediate CPR when needed, and rapid activation of emergency services are key for survival.',
    guide_drowning_step1_title: 'Ensure your own safety',
    guide_drowning_step1_desc:
      'Do not enter dangerous water. Use flotation devices or reach with a pole or rope if possible.',
    guide_drowning_step2_title: 'Remove from water',
    guide_drowning_step2_desc:
      'Once safe, bring the person to firm ground and lay them on their back.',
    guide_drowning_step3_title: 'Check breathing and responsiveness',
    guide_drowning_step3_desc:
      'If they are not breathing normally, call emergency services and start CPR immediately.',
    guide_drowning_step4_title: 'Provide rescue breaths',
    guide_drowning_step4_desc:
      'In drowning, rescue breaths are especially important. Give 2 breaths, then continue CPR cycles as trained.',
    guide_drowning_step5_title: 'Monitor even if they recover',
    guide_drowning_step5_desc:
      'Seek medical evaluation after any near‑drowning event, as lung complications can develop later.',

    // ----- Seizures -----
    guide_seizure_title: 'Seizures & Convulsions',
    guide_seizure_category: 'Medical',
    guide_seizure_updated: '2 weeks ago',
    guide_seizure_short:
      'Protect the person from injury, do not restrain them or put anything in their mouth, and time the seizure.',
    guide_seizure_full:
      'Seizures cause uncontrolled movements and changes in awareness. Protecting the head, clearing nearby hazards, and knowing when to call for help are essential.',
    guide_seizure_step1_title: 'Stay calm and time the seizure',
    guide_seizure_step1_desc:
      'Note the start time and observe how long the seizure lasts.',
    guide_seizure_step2_title: 'Protect from injury',
    guide_seizure_step2_desc:
      'Clear objects nearby, cushion the head with something soft, and loosen tight clothing around the neck.',
    guide_seizure_step3_title:
      'Do not restrain or put anything in the mouth',
    guide_seizure_step3_desc:
      'Allow the seizure to run its course. Do not hold them down or insert objects into their mouth.',
    guide_seizure_step4_title: 'Place in recovery position after seizure',
    guide_seizure_step4_desc:
      'When movements stop and they begin to breathe normally, roll them onto their side if safe.',
    guide_seizure_step5_title: 'Call for help when needed',
    guide_seizure_step5_desc:
      'Seek emergency help if the seizure lasts more than 5 minutes, repeats, or if the person has trouble breathing afterward.',

    // ----- Stroke -----
    guide_stroke_title: 'Stroke (Brain Attack)',
    guide_stroke_category: 'Medical',
    guide_stroke_updated: '3 weeks ago',
    guide_stroke_short:
      'Use FAST: Face drooping, Arm weakness, Speech difficulty, Time to call emergency services.',
    guide_stroke_full:
      'Stroke happens when blood flow to part of the brain is blocked or a blood vessel bursts. Recognizing symptoms quickly and calling emergency services immediately greatly improves outcomes.',
    guide_stroke_step1_title: 'Check using FAST',
    guide_stroke_step1_desc:
      'Face: ask them to smile; Arm: ask them to raise both arms; Speech: ask them to repeat a simple phrase and check for slurring.',
    guide_stroke_step2_title: 'Call emergency services immediately',
    guide_stroke_step2_desc:
      'Do not wait for symptoms to improve. Rapid treatment in hospital is critical.',
    guide_stroke_step3_title: 'Note the time symptoms started',
    guide_stroke_step3_desc:
      'Record when the person was last seen well. This information helps guide hospital treatment.',
    guide_stroke_step4_title: 'Keep the person safe and comfortable',
    guide_stroke_step4_desc:
      'Help them to sit or lie in a comfortable position, loosen tight clothing, and reassure them.',
    guide_stroke_step5_title: 'Monitor breathing and consciousness',
    guide_stroke_step5_desc:
      'Be prepared to start CPR if they stop breathing or become unresponsive.',

    // ----- Typhoon -----
    guide_typhoon_title: 'Typhoon Preparedness',
    guide_typhoon_category: 'Disaster',
    guide_typhoon_updated: '1 week ago',
    guide_typhoon_short:
      'Prepare your home, emergency kit, and evacuation plan before a typhoon makes landfall.',
    guide_typhoon_full:
      'Typhoons can bring strong winds, heavy rain, storm surges, and flooding. Preparation before the storm greatly reduces risk to life and property.',
    guide_typhoon_step1_title: 'Prepare an emergency kit',
    guide_typhoon_step1_desc:
      'Pack water, non‑perishable food, flashlight, batteries, radio, medications, and important documents in a waterproof bag.',
    guide_typhoon_step2_title: 'Secure your home',
    guide_typhoon_step2_desc:
      'Bring loose items indoors, reinforce windows if possible, and know how to switch off gas and electricity.',
    guide_typhoon_step3_title: 'Know evacuation routes',
    guide_typhoon_step3_desc:
      'Identify the nearest evacuation center and safest route, especially if you live in low‑lying or coastal areas.',
    guide_typhoon_step4_title: 'Monitor official advisories',
    guide_typhoon_step4_desc:
      'Follow updates from local authorities, PAGASA, or NDRRMC. Evacuate immediately if told to do so.',
  },

  tl: {
    // ----- App / UI -----
    appTitle: 'SafePH',
    appSubtitle: 'Tugon sa Emergency',

    tabHome: 'Bahay',
    tabGuides: 'Mga Gabay',
    tabMap: 'Mapa',
    tabHistory: 'Kasaysayan',
    tabSettings: 'Settings',

    home_sos: 'TULONG',
    home_sending: 'NAGPAPADALA...',
    home_alertSentTitle: '🚨 Naipadala na ang Emergency Alert',
    home_alertSentBody:
      'SMS, push notification, at lokasyon ay ibinahagi sa emergency contacts (simulation)',
    home_shareLocationTitle: 'I-share ang Lokasyon',
    home_shareLocationBody: 'Live GPS tracking (simulation)',
    home_disasterAlertsTitle: 'Babala sa Sakuna',
    home_disasterAlertsBody: 'Real-time na updates (simulation)',
    home_lastSharedLocation: 'Huling na-share na lokasyon',
    home_latestDisasterAlerts: 'Pinakabagong Babala sa Sakuna',
    home_quickDial: 'Mabilisang Tawag',
    home_call: 'Tumawag',

    geo_notSupported: 'Hindi sinusuportahan ng device na ito ang geolocation.',
    geo_unableLocation: 'Hindi makuha ang iyong lokasyon.',
    geo_unableLocationAlerts:
      'Hindi makuha ang iyong lokasyon para sa mga babala.',

    alerts_noActive: 'Walang aktibong babala sa lugar mo sa ngayon.',
    alerts_loaded:
      'Na-load ang pinakabagong mga disaster alert mula sa OpenWeather.',
    alerts_failed: 'Hindi ma-load ang disaster alerts mula sa server.',

    sos_sent: 'Naipadala ang SOS sa iyong mga emergency contact.',

    guides_title: 'Mga First Aid Guide',
    guides_subtitle:
      'Piliin ang gabay para makita ang mga hakbang at maikling video. Pangkalahatang payo lang ito at hindi kapalit ng propesyonal na pagsasanay.',
    guides_searchPlaceholder: 'Maghanap ng gabay (hal. CPR, paso, pilay)...',
    guides_showing: 'Ipinapakita ang',
    guides_of: 'ng',
    guides_guides: 'gabay',
    guides_none:
      'Walang nahanap na gabay. Subukan ang iba pang keyword tulad ng "CPR", "paso", o "pilay".',
    guides_updated: 'In-update',
    guides_stepTitle: 'Hakbang-hakbang na gabay',
    guides_thumbHint:
      'I-tap ang thumbnail para buksan ang buong video sa YouTube.',
    guides_step: 'Hakbang',

    map_title: 'Mapa at mga Ruta',
    map_subtitle: 'Live na mapa gamit ang kasalukuyan mong lokasyon',
    map_evacRoutesTitle: 'Mga Ruta ng Evacuation',
    map_evacRoutesBody:
      'Gamitin ang mapa para hanapin ang pinakamalapit na ligtas na lugar at evacuation center.',
    map_hazardTitle: 'Hazard Overlay',
    map_hazardBody:
      'Sa susunod, puwedeng dagdagan ng weather at flood overlays.',

    history_title: 'Kasaysayan ng Emergency',
    history_subtitle: 'Subaybayan ang lahat ng nagawa mong emergency',
    history_sosAlerts: 'Mga SOS Alert',
    history_totalEvents: 'Kabuuang Kaganapan',
    history_resolvedPercent: 'Nalutas',
    history_filter_all: 'Lahat',
    history_filter_sos: 'Mga SOS Alert',
    history_filter_calls: 'Mga Tawag',
    history_filter_disaster: 'Babala sa Sakuna',
    history_none: 'Wala pang kasaysayan.',
    history_guidePrefix: 'Gabay:',
    history_respondersPrefix: 'Mga responder:',

    settings_title: 'Settings',
    settings_subtitle: 'Ayusin ang iyong SafePH experience',
    settings_emergencyContacts: 'Mga Emergency Contact',
    settings_updateContacts: 'I-update ang iyong mga emergency number',
    settings_editNumbers: 'I-edit ang Mga Numero',
    settings_language: 'Wika',
    settings_languageDesc: 'Palitan ang wika ng app',
    settings_about: 'Tungkol sa SafePH',
    settings_aboutDesc:
      'Isang simpleng emergency app para sa Pilipinas',
    settings_version: 'Bersyon 1.0.0',
    settings_feedback: 'Magpadala ng Feedback',
    settings_feedbackDesc:
      'Sabihin sa amin kung ano pa ang puwedeng pagandahin',
    settings_feedbackBtn: 'Magpadala ng Feedback',
    settings_lang_english: 'Ingles',
    settings_lang_tagalog: 'Tagalog',
    settings_lang_cebuano: 'Cebuano',

    // ----- CPR -----
    guide_cpr_title: 'Mga Gabay sa CPR',
    guide_cpr_short:
      'Kilalanin ang cardiac arrest at agad magsimula ng chest compressions habang hinihintay ang emergency responders.',
    guide_cpr_full:
      'Ang CPR (cardiopulmonary resuscitation) ay ginagamit kapag walang senyales ng buhay o hindi normal ang paghinga ng isang tao. Layunin nitong mapanatiling dumadaloy ang dugo at oxygen sa utak at mahahalagang bahagi ng katawan hanggang makarating ang mas advanced na tulong.',
    guide_cpr_step1_title: 'Suriin ang responsibo at paghinga',
    guide_cpr_step1_desc:
      'Kalogin at tawagin ang tao. Kapag walang sagot at hindi normal ang paghinga o hingal-hingal lang, tumawag agad sa emergency services.',
    guide_cpr_step2_title: 'Tumawag ng tulong',
    guide_cpr_step2_desc:
      'I-dial ang local emergency number (hal. 911 o 143) o ipasabi sa iba habang sinisimulan mo ang CPR.',
    guide_cpr_step3_title: 'Simulan ang chest compressions',
    guide_cpr_step3_desc:
      'Ilagay ang palad sa gitna ng dibdib, ilagay ang kabilang kamay sa ibabaw, at idiin nang mabilis at malakas mga 100–120 beses bawat minuto.',
    guide_cpr_step4_title: 'Magbigay ng rescue breaths (kung sanay)',
    guide_cpr_step4_desc:
      'Pagkatapos ng 30 compressions, itagilid nang bahagya ang ulo, iangat ang baba, pisilin ang ilong, at magbigay ng 2 hininga habang minamasdan ang pag-angat ng dibdib.',
    guide_cpr_step5_title: 'Ipagpatuloy hanggang may dumating na tulong',
    guide_cpr_step5_desc:
      'Huwag tumigil sa CPR maliban kung normal nang humihinga ang pasyente, may sanay na tumulong, o hindi mo na kaya pisikal.',

    // ----- Choking -----
    guide_choking_title: 'Pagkabulunan (Matanda at Bata)',
    guide_choking_category: 'Critical',
    guide_choking_updated: '3 araw na ang nakalipas',
    guide_choking_short:
      'Kilalanin ang pagkabulunan at gumamit ng back blows at abdominal thrusts para maalis ang bara.',
    guide_choking_full:
      'Ang pagkabulunan ay nangyayari kapag may bagay na bumara sa daanan ng hangin kaya hindi makapasok ang hangin sa baga. Mabilis at malalakas na back blows at abdominal thrusts ang makakatulong para mailabas ang bara bago mawalan ng malay ang tao.',
    guide_choking_step1_title: 'Kumpirmahin kung matinding pagkabulunan',
    guide_choking_step1_desc:
      'Tanungin, “Nabubulunan ka ba?” Ang taong may matinding pagkabulunan ay kadalasang hindi makapagsalita, makaubo, o makahinga at madalas hawak ang kanyang lalamunan.',
    guide_choking_step2_title: 'Magbigay ng back blows',
    guide_choking_step2_desc:
      'Tumayo nang bahagyang nasa likod at gilid. Suportahan ang dibdib at magbigay ng hanggang 5 malalakas na palo sa likod sa pagitan ng mga balikat gamit ang sakong ng kamay.',
    guide_choking_step3_title: 'Magbigay ng abdominal thrusts',
    guide_choking_step3_desc:
      'Kung hindi pa rin lumalabas ang bara, tumayo sa likod ng tao, ipuwesto ang kamao sa itaas ng pusod, hawakan gamit ang kabilang kamay, at hilahin paloob at pataas nang hanggang 5 beses.',
    guide_choking_step4_title:
      'Magpalitan hanggang luminaw o mawalan ng malay',
    guide_choking_step4_desc:
      'Salitan ang 5 back blows at 5 abdominal thrusts hanggang mailabas ang bara o mawalan ng malay ang tao.',
    guide_choking_step5_title:
      'Kung mawalan ng malay, magsimula ng CPR',
    guide_choking_step5_desc:
      'Dahan-dahang ihiga sa sahig, tumawag sa emergency services, at magsimula ng CPR. Suriin ang bibig para sa nakikitang bara bago magbigay ng hininga.',

    // ----- Severe Bleeding -----
    guide_bleeding_title: 'Matinding Pagdurugo at Hiwa',
    guide_bleeding_category: 'Injury',
    guide_bleeding_updated: '1 araw na ang nakalipas',
    guide_bleeding_short:
      'Kontrolin agad ang pagdurugo gamit ang direktang pressure at panatilihing kalmado ang tao habang paparating ang tulong.',
    guide_bleeding_full:
      'Ang matinding pagdurugo ay maaaring ikapahamak ng buhay kung hindi kaagad makokontrol. Ang malakas na pagdiin gamit ang malinis na tela o benda at pag-angat ng nasugatang bahagi ay nakakatulong magpabagal ng pagdurugo hanggang dumating ang mga propesyonal.',
    guide_bleeding_step1_title:
      'Tiyakin ang kaligtasan ng lugar at protektahan ang sarili',
    guide_bleeding_step1_desc:
      'Siguruhing ligtas lumapit. Kung mayroon, magsuot ng guwantes o gumamit ng plastik na harang para mabawasan ang direktang kontak sa dugo.',
    guide_bleeding_step2_title: 'Maglagay ng direktang pressure',
    guide_bleeding_step2_desc:
      'Ilagay ang malinis na tela, gauze, o benda direkta sa sugat at idiin nang mariin gamit ang iyong kamay.',
    guide_bleeding_step3_title: 'Panatilihing tuloy-tuloy ang pressure',
    guide_bleeding_step3_desc:
      'Huwag alisin ang mga telang nabasa ng dugo; magdagdag na lang ng panibagong layer sa ibabaw at magpatuloy sa pagdiin.',
    guide_bleeding_step4_title: 'Itaas kung maaari',
    guide_bleeding_step4_desc:
      'Kung walang hinalang bali, itaas ang nasugatang bahagi nang mas mataas sa puso upang makatulong pabagalin ang pagdurugo.',
    guide_bleeding_step5_title: 'Maghanap agad ng medikal na tulong',
    guide_bleeding_step5_desc:
      'Tumawag sa emergency services kung malakas ang pagdurugo, sumisirit, o hindi humihinto sa pressure, o kung malalim o malaki ang sugat.',

    // ----- Burns -----
    guide_burns_title: 'Paso at Pagkakabuhos ng Mainit',
    guide_burns_category: 'Injury',
    guide_burns_updated: '3 araw na ang nakalipas',
    guide_burns_short:
      'Palamigin ang paso sa ilalim ng umaagos na tubig, alisin ang masisikip na gamit, at iwasan ang mga home remedy gaya ng langis o toothpaste.',
    guide_burns_full:
      'Ang mga paso ay maaaring dulot ng init, apoy, mainit na likido, kuryente, o kemikal. Agarang pagpapalamig gamit ang malamig (hindi yelo) na tubig ang nakababawas ng sakit at pinsala sa tisyu at nakakapagpababa ng komplikasyon.',
    guide_burns_step1_title: 'Itigil ang pinanggagalingan ng paso',
    guide_burns_step1_desc:
      'Patayin ang init o kuryente kung ligtas, ilayo ang tao sa pinagmulan, at alisin ang anumang nasusunog na damit o alahas malapit sa paso.',
    guide_burns_step2_title: 'Palamigin ang paso',
    guide_burns_step2_desc:
      'Ilagay ang naapektuhang bahagi sa ilalim ng malamig (hindi yelo) na umaagos na tubig nang hindi bababa sa 20 minuto o maglagay ng malamig, basang compress.',
    guide_burns_step3_title: 'Protektahan ang bahagi',
    guide_burns_step3_desc:
      'Takpan ang paso nang maluwag gamit ang sterile, hindi dumidikit na dressing o malinis na tela. Huwag pumutok ng paltos.',
    guide_burns_step4_title:
      'Iwasan ang mga cream at home remedy',
    guide_burns_step4_desc:
      'Huwag maglagay ng mantikilya, langis, toothpaste, o yelo direkta sa paso dahil maaari nitong palalain ang pinsala.',
    guide_burns_step5_title:
      'Magpatingin sa doktor para sa malalang paso',
    guide_burns_step5_desc:
      'Maghanap agad ng tulong para sa mga paso sa mukha, kamay, paa, ari, malalaking bahagi ng katawan, o anumang malalim, electrical, o chemical burn.',

    // ----- Fracture -----
    guide_fracture_title: 'Nabaling Buto (Fracture)',
    guide_fracture_category: 'Injury',
    guide_fracture_updated: '1 araw na ang nakalipas',
    guide_fracture_short:
      'Immobilize o huwag pagalawin ang nasugatang bahagi at iwasan ang karagdagang galaw hanggang may propesyonal na tumulong.',
    guide_fracture_full:
      'Ang fracture ay maaaring dulot ng pagkahulog, aksidente, o direktang tama. Ang tamang first aid ay nakababawas ng sakit at nakakapigil sa karagdagang pinsala sa paligid ng nabaling buto.',
    guide_fracture_step1_title:
      'Suriin kung may bukas na sugat at deformity',
    guide_fracture_step1_desc:
      'Tingnan kung may pamamaga, pasa, o kakaibang pagkakatuwid ng biyas. Huwag piliting ituwid ang nabaling buto.',
    guide_fracture_step2_title: 'Immobilize ang bahagi',
    guide_fracture_step2_desc:
      'Gumamit ng splint, pinulupot na magasin, o tabla para pigilan ang paggalaw. Itali sa itaas at ibaba ng bahagi ng pinsala.',
    guide_fracture_step3_title: 'Maglagay ng cold pack',
    guide_fracture_step3_desc:
      'Maglagay ng yelong binalot sa tela sa nasugatang bahagi nang hanggang 20 minuto para mabawasan ang pamamaga at sakit.',
    guide_fracture_step4_title: 'Bantayan ang shock',
    guide_fracture_step4_desc:
      'Ihiga ang tao, panatilihing mainit, at bantayan kung namumutla, malamig at basa ang balat, o nalilito.',
    guide_fracture_step5_title:
      'Magpatingin agad sa doktor',
    guide_fracture_step5_desc:
      'Dalhin ang tao sa pinakamalapit na emergency department o tumawag ng ambulansya kung delikado siyang igalaw o kung matindi ang sakit.',

    // ----- Sprains & Strains -----
    guide_sprain_title: 'Pilay at Pagkaunat ng Kalamnan',
    guide_sprain_category: 'Injury',
    guide_sprain_updated: '4 na araw na ang nakalipas',
    guide_sprain_short:
      'Gamitin ang RICE: rest, ice, compression, at elevation para pamahalaan ang karaniwang injury sa kasu-kasuan.',
    guide_sprain_full:
      'Ang sprain ay pinsala sa ligaments, habang ang strain ay sa kalamnan o litid. Maraming banayad na pilay at pagkaunat ang puwedeng alagaan sa bahay gamit ang rest, ice, compression, at elevation sa unang yugto.',
    guide_sprain_step1_title: 'Ipa-rest ang nasugatang bahagi',
    guide_sprain_step1_desc:
      'Itigil ang aktibidad at iwasang bigyan ng bigat o pilay ang nasugatang biyas o kasu-kasuan.',
    guide_sprain_step2_title: 'Maglagay ng yelo',
    guide_sprain_step2_desc:
      'Maglagay ng cold pack o balot na yelo sa bahagi nang 15–20 minuto bawat 2–3 oras sa unang araw.',
    guide_sprain_step3_title: 'Gumamit ng compression',
    guide_sprain_step3_desc:
      'Balutin ng elastic bandage nang hindi sobrang sikip para hindi manginig o manhid.',
    guide_sprain_step4_title: 'Itaas ang biyas',
    guide_sprain_step4_desc:
      'Itaas ang nasugatang bahagi nang mas mataas sa puso para mabawasan ang pamamaga.',
    guide_sprain_step5_title:
      'Magpatingin kung kinakailangan',
    guide_sprain_step5_desc:
      'Magpatingin kung matindi ang sakit, hindi magamit ang kasu-kasuan, o may deformity o hinalang fracture.',

    // ----- Head Injury -----
    guide_head_title: 'Head Injury at Concussion',
    guide_head_category: 'Injury',
    guide_head_updated: '5 araw na ang nakalipas',
    guide_head_short:
      'Bantayan ang pagkalito, pagsusuka, o lumalalang sakit ng ulo matapos tamaan sa ulo at magpatingin agad kung meron nito.',
    guide_head_full:
      'Ang head injury ay maaaring mula sa simpleng bukol hanggang sa malalang pinsala sa utak. Anumang pagkawala ng malay, pagkalito, paulit-ulit na pagsusuka, o lumalalang sintomas ay nangangailangan ng agarang medikal na pagsusuri.',
    guide_head_step1_title: 'Suriin kung gising at maayos',
    guide_head_step1_desc:
      'Kausapin ang tao, magtanong ng simpleng tanong, at tingnan kung normal ang sagot.',
    guide_head_step2_title: 'Hanapin ang mga danger signs',
    guide_head_step2_desc:
      'Bantayan ang pagkalito, paulit-ulit na pagsusuka, malubha o lumalalang sakit ng ulo, pangingisay, panghihina, o hindi magkasinglaki na pupil.',
    guide_head_step3_title: 'Panatilihing hindi gumagalaw',
    guide_head_step3_desc:
      'Ihiga ang tao at iwasang galawin ang leeg kung pinaghihinalaang may pinsala sa leeg o spine.',
    guide_head_step4_title: 'Maglagay ng cold pack sa bukol',
    guide_head_step4_desc:
      'Para sa banayad na bukol, dahan-dahang maglagay ng malamig na compress na binalot sa tela upang mabawasan ang pamamaga.',
    guide_head_step5_title: 'Magpatingin sa doktor',
    guide_head_step5_desc:
      'Tumawag sa emergency services o pumunta sa ospital kung may danger signs o hindi gumagaling ang mga sintomas.',

    // ----- Hypothermia -----
    guide_hypo_title: 'Hypothermia at Pagkalantad sa Lamig',
    guide_hypo_category: 'Medical',
    guide_hypo_updated: '2 linggo na ang nakalipas',
    guide_hypo_short:
      'Painitin ang tao nang dahan-dahan, alisin ang basang damit, at magpatingin kung may pagkalito o sobrang antok.',
    guide_hypo_full:
      'Ang hypothermia ay nangyayari kapag sobrang bumaba ang temperatura ng katawan, kadalasan dahil sa basang o malamig na kapaligiran. Mabagal at maingat na pagpainit at agarang medikal na tulong ang pumipigil sa malalang komplikasyon.',
    guide_hypo_step1_title:
      'Dalhin sa mainit at tuyong lugar',
    guide_hypo_step1_desc:
      'Ilayo ang tao sa hangin at lamig at alisin ang basang damit, palitan ng tuyo at maraming layer.',
    guide_hypo_step2_title: 'Dahan-dahang painitin ang katawan',
    guide_hypo_step2_desc:
      'Gumamit ng kumot, mainit na damit, o init ng katawan. Bigyang-pansin muna ang dibdib, leeg, at ulo.',
    guide_hypo_step3_title: 'Magbigay ng mainit na inumin kung gising',
    guide_hypo_step3_desc:
      'Kung gising at kayang lumunok, magbigay ng mainit, matamis, at hindi alcoholic na inumin.',
    guide_hypo_step4_title: 'Iwasan ang matinding init',
    guide_hypo_step4_desc:
      'Huwag gumamit ng sobrang init na tubig, heating pad, o masidhing pagmasahe sa balat dahil maaari itong magdulot ng problema.',
    guide_hypo_step5_title: 'Magpatingin sa doktor',
    guide_hypo_step5_desc:
      'Tumawag sa emergency services kung may pagkalito, sobrang antok, mabagal na paghinga, o kung hindi agad bumubuti ang lagay.',

    // ----- Drowning -----
    guide_drowning_title: 'Pagkalunod at Halos Pagkalunod',
    guide_drowning_category: 'Critical',
    guide_drowning_updated: '2 linggo na ang nakalipas',
    guide_drowning_short:
      'Unahin ang kaligtasan, ilabas sa tubig kung maaari, magsimula ng CPR kung hindi humihinga, at tumawag sa emergency.',
    guide_drowning_full:
      'Ang pagkalunod ay maaaring mangyari nang mabilis at tahimik. Ligtas na pag-rescue, agarang CPR kapag kailangan, at mabilis na pagtawag sa emergency services ang susi sa kaligtasan.',
    guide_drowning_step1_title: 'Tiyakin ang sariling kaligtasan',
    guide_drowning_step1_desc:
      'Huwag pumasok sa delikadong tubig. Gumamit ng flotation device o abutin gamit ang mahabang bagay o lubid kung maaari.',
    guide_drowning_step2_title: 'Ilabas sa tubig',
    guide_drowning_step2_desc:
      'Kapag ligtas na, ilapit ang tao sa matigas na lupa at ihiga siya nang patihaya.',
    guide_drowning_step3_title:
      'Suriin ang paghinga at kung gising',
    guide_drowning_step3_desc:
      'Kung hindi normal ang paghinga, tumawag sa emergency services at agad magsimula ng CPR.',
    guide_drowning_step4_title: 'Magbigay ng rescue breaths',
    guide_drowning_step4_desc:
      'Sa pagkalunod, napakahalaga ng rescue breaths. Magbigay ng 2 hininga, saka ipagpatuloy ang CPR cycles ayon sa iyong training.',
    guide_drowning_step5_title:
      'Bantayan kahit mukhang okay na',
    guide_drowning_step5_desc:
      'Magpatingin sa doktor pagkatapos ng anumang near‑drowning dahil maaaring magkaroon ng problema sa baga kalaunan.',

    // ----- Seizures -----
    guide_seizure_title: 'Pagsumpong at Pagkikikig',
    guide_seizure_category: 'Medical',
    guide_seizure_updated: '2 linggo na ang nakalipas',
    guide_seizure_short:
      'Protektahan ang tao sa pinsala, huwag siyang pigilan o lagyan ng kahit ano sa bibig, at i-timing ang seizure.',
    guide_seizure_full:
      'Ang seizures ay nagdudulot ng hindi kontroladong galaw at pagbabago sa ulirat. Ang pagprotekta sa ulo, pag-alis ng mga nakapaligid na panganib, at pag-alam kung kailan tatawag ng tulong ay napakahalaga.',
    guide_seizure_step1_title:
      'Manatiling kalmado at i-timing ang seizure',
    guide_seizure_step1_desc:
      'Tandaan kung anong oras nagsimula at gaano katagal tumatagal ang seizure.',
    guide_seizure_step2_title: 'Protektahan laban sa pinsala',
    guide_seizure_step2_desc:
      'Alisin ang mga matutulis na bagay sa paligid, lagyan ng malambot na sapin ang ulo, at luwagan ang masisikip na damit sa leeg.',
    guide_seizure_step3_title:
      'Huwag pigilan o maglagay ng kahit ano sa bibig',
    guide_seizure_step3_desc:
      'Hayaan lamang ang seizure na matapos. Huwag siyang hawakan nang mahigpit at huwag maglagay ng anumang bagay sa kanyang bibig.',
    guide_seizure_step4_title:
      'Ihiga sa recovery position pagkatapos ng seizure',
    guide_seizure_step4_desc:
      'Kapag huminto na ang galaw at normal nang humihinga, dahan-dahang ihiga siya sa tagiliran kung ligtas.',
    guide_seizure_step5_title:
      'Tumawag ng tulong kapag kinakailangan',
    guide_seizure_step5_desc:
      'Tumawag sa emergency services kung tumatagal nang higit sa 5 minuto, paulit-ulit, o hirap siyang huminga pagkatapos.',

    // ----- Stroke -----
    guide_stroke_title: 'Stroke (Brain Attack)',
    guide_stroke_category: 'Medical',
    guide_stroke_updated: '3 linggo na ang nakalipas',
    guide_stroke_short:
      'Gamitin ang FAST: Face drooping, Arm weakness, Speech difficulty, Time para tumawag ng emergency.',
    guide_stroke_full:
      'Ang stroke ay nangyayari kapag nababara ang daloy ng dugo sa bahagi ng utak o pumuputok ang ugat. Ang mabilis na pagkilala sa sintomas at pagtawag agad sa emergency services ay malaking tulong sa paggaling.',
    guide_stroke_step1_title: 'Suriin gamit ang FAST',
    guide_stroke_step1_desc:
      'Face: ipangiti; Arm: ipataas ang dalawang braso; Speech: ipaulit ang simpleng pangungusap at tingnan kung malabo o pautal.',
    guide_stroke_step2_title:
      'Tumawag agad sa emergency services',
    guide_stroke_step2_desc:
      'Huwag maghintay na bumuti ang sintomas. Napakahalaga ng mabilis na gamutan sa ospital.',
    guide_stroke_step3_title:
      'Tandaan kung kailan nagsimula ang sintomas',
    guide_stroke_step3_desc:
      'Itala kung anong oras huling nakita na maayos ang tao. Mahalaga ito sa magiging gamutan.',
    guide_stroke_step4_title:
      'Panatilihing ligtas at komportable ang tao',
    guide_stroke_step4_desc:
      'Iupo o ihiga sa komportableng posisyon, luwagan ang masisikip na damit, at pakalmahin siya.',
    guide_stroke_step5_title:
      'Bantayan ang paghinga at ulirat',
    guide_stroke_step5_desc:
      'Maging handa na magsimula ng CPR kung biglang hihinto ang paghinga o mawawalan ng malay.',

    // ----- Typhoon -----
    guide_typhoon_title: 'Paghahanda sa Bagyo',
    guide_typhoon_category: 'Disaster',
    guide_typhoon_updated: '1 linggo na ang nakalipas',
    guide_typhoon_short:
      'Ihanda ang bahay, emergency kit, at evacuation plan bago dumating ang bagyo.',
    guide_typhoon_full:
      'Ang bagyo ay maaaring magdala ng malalakas na hangin, malakas na ulan, storm surge, at pagbaha. Ang paghahanda bago ang bagyo ay malaking tulong para mabawasan ang panganib sa buhay at ari-arian.',
    guide_typhoon_step1_title:
      'Maghanda ng emergency kit',
    guide_typhoon_step1_desc:
      'Mag-impake ng tubig, pagkaing hindi madaling masira, flashlight, baterya, radyo, gamot, at mahahalagang dokumento sa waterproof na bag.',
    guide_typhoon_step2_title: 'Siguraduhin ang bahay',
    guide_typhoon_step2_desc:
      'Ipasok ang mga bagay na maaaring liparin ng hangin, palakasin ang mga bintana kung kaya, at alamin kung paano patayin ang gas at kuryente.',
    guide_typhoon_step3_title:
      'Alamin ang mga ruta ng evacuation',
    guide_typhoon_step3_desc:
      'Alamin ang pinakamalapit na evacuation center at pinakaligtas na ruta, lalo na kung nakatira sa mababang lugar o tabing-dagat.',
    guide_typhoon_step4_title:
      'Sundan ang opisyal na abiso',
    guide_typhoon_step4_desc:
      'Sundan ang update mula sa lokal na awtoridad, PAGASA, o NDRRMC. Agad lumikas kung inuutusan.',

  },

  ceb: {
    // ----- App / UI -----
    appTitle: 'SafePH',
    appSubtitle: 'Emergency Response',

    tabHome: 'Balay',
    tabGuides: 'Mga Giya',
    tabMap: 'Mapa',
    tabHistory: 'Kasaysayan',
    tabSettings: 'Settings',

    home_sos: 'TABANG',
    home_sending: 'NAGPADALA...',
    home_alertSentTitle: '🚨 Na-send na ang Emergency Alert',
    home_alertSentBody:
      'SMS, push notification, ug lokasyon gi-share sa emergency contacts (simulation)',
    home_shareLocationTitle: 'I-share ang Lokasyon',
    home_shareLocationBody: 'Live GPS tracking (simulation)',
    home_disasterAlertsTitle: 'Disaster Alerts',
    home_disasterAlertsBody: 'Real-time nga updates (simulation)',
    home_lastSharedLocation: 'Last nga gi-share nga lokasyon',
    home_latestDisasterAlerts: 'Pinakabag-ong Disaster Alerts',
    home_quickDial: 'Pas-pas nga Tawag',
    home_call: 'Tawag',

    geo_notSupported:
      'Dili mosuporta og geolocation ang imong device.',
    geo_unableLocation: 'Dili makuha ang imong lokasyon.',
    geo_unableLocationAlerts:
      'Dili makuha ang imong lokasyon para sa alerts.',

    alerts_noActive:
      'Walay aktibong alert sa imong lugar karon.',
    alerts_loaded:
      'Na-load ang pinakabag-ong disaster alerts gikan sa OpenWeather.',
    alerts_failed:
      'Napakyas sa pag-load sa disaster alerts gikan sa server.',

    sos_sent: 'Na-send na ang SOS sa imong emergency contacts.',

    guides_title: 'Mga First Aid Guide',
    guides_subtitle:
      'Pindota ang giya aron makita ang mga lakang ug mubo nga video. Kini usa ka kasagarang tambag ug dili kapuli sa propesyonal nga training.',
    guides_searchPlaceholder:
      'Pangitaa ang giya (pananglitan CPR, paso, pilay)...',
    guides_showing: 'Gipakita',
    guides_of: 'sa',
    guides_guides: 'mga giya',
    guides_none:
      'Walay nahanap nga giya. Sulayi lain nga keyword sama sa "CPR", "paso", o "pilay".',
    guides_updated: 'Gi-update',
    guides_stepTitle: 'Lakang-lakang nga giya',
    guides_thumbHint:
      'Pindota ang thumbnail aron ma-open ang full video sa YouTube.',
    guides_step: 'Lakang',

    map_title: 'Mapa ug mga Ruta',
    map_subtitle:
      'Live nga mapa gamit ang imong kasamtangang lokasyon',
    map_evacRoutesTitle: 'Mga Evacuation Route',
    map_evacRoutesBody:
      'Gamita kini nga mapa aron pangitaon ang labing duol nga safe zone ug evacuation center.',
    map_hazardTitle: 'Hazard Overlay',
    map_hazardBody:
      'Sunod, pwede nimo dugangan og weather ug flood overlays.',

    history_title: 'Kasaysayan sa Emergency',
    history_subtitle:
      'Subaya ang tanang mga emergency nga imong gihimo',
    history_sosAlerts: 'Mga SOS Alert',
    history_totalEvents: 'Total nga mga Kasinatian',
    history_resolvedPercent: 'Na-resolve',
    history_filter_all: 'Tanan',
    history_filter_sos: 'Mga SOS Alert',
    history_filter_calls: 'Mga Tawag',
    history_filter_disaster: 'Disaster Alerts',
    history_none: 'Wala pa kay kasaysayan.',
    history_guidePrefix: 'Giya:',
    history_respondersPrefix: 'Mga responder:',

    settings_title: 'Settings',
    settings_subtitle: 'Ayuhon ang imong SafePH experience',
    settings_emergencyContacts: 'Mga Emergency Contact',
    settings_updateContacts:
      'I-update ang imong mga emergency number',
    settings_editNumbers: 'Usba ang Mga Numero',
    settings_language: 'Pinulongan',
    settings_languageDesc:
      'Ilisdi ang pinulongan sa app',
    settings_about: 'Mahitungod sa SafePH',
    settings_aboutDesc:
      'Usa ka yano nga emergency app para sa Pilipinas',
    settings_version: 'Bersyon 1.0.0',
    settings_feedback: 'Ipadala ang Feedback',
    settings_feedbackDesc:
      'Sultihi mi unsay kinahanglan pa nga usbon',
    settings_feedbackBtn: 'Ipadala ang Feedback',
    settings_lang_english: 'Ingles',
    settings_lang_tagalog: 'Tagalog',
    settings_lang_cebuano: 'Cebuano',

    // ----- CPR -----
    guide_cpr_title: 'CPR nga mga Giya',
    guide_cpr_short:
      'Ila-a ang cardiac arrest ug dali pag-sugod sa chest compressions samtang naghulat sa emergency responders.',
    guide_cpr_full:
      'Ang CPR (cardiopulmonary resuscitation) gamiton kung walay timailhan sa kinabuhi o dili normal ang pagginhawa sa usa ka tawo. Tumong niini nga mapadayon ang sirkulasyon sa dugo ug oxygen sa utok ug importante nga bahin sa lawas hangtod moabot ang mas taas nga klase sa tabang.',
    guide_cpr_step1_title:
      'Susiha kung motubag ug nagginhawa',
    guide_cpr_step1_desc:
      'Kalog-a ug tawga ang tawo. Kon walay tubag ug dili normal ang pagginhawa o hinay-hinay lang, tawag dayon og emergency services.',
    guide_cpr_step2_title: 'Tawag og tabang',
    guide_cpr_step2_desc:
      'Dial-a ang local emergency number (pananglitan 911 o 143) o pangayo tabang sa uban samtang nagsugod ka sa CPR.',
    guide_cpr_step3_title:
      'Sugdi ang chest compressions',
    guide_cpr_step3_desc:
      'Ibutang ang palad sa tunga sa dughan, ibutang ang laing kamot sa ibabaw, ug pusli kusog ug paspas mga 100–120 kada minuto.',
    guide_cpr_step4_title:
      'Hatagi og rescue breaths (kon na-train)',
    guide_cpr_step4_desc:
      'Human sa 30 compressions, ipatagilid gamay ang ulo, isaka ang baba, ipisil ang ilong, ug hatagi og 2 ka hininga samtang tan-awon ang pag-alsa sa dughan.',
    guide_cpr_step5_title:
      'Padayona hangtod moabot ang tabang',
    guide_cpr_step5_desc:
      'Ayaw undangi ang CPR gawas kung normal na siya og ginhawa, adunay sanay nga mopuli, o dili na nimo kaya pisikal.',

    // ----- Choking -----
    guide_choking_title:
      'Pagkaugdaw / Pagkabulonan (Hamtong ug Bata)',
    guide_choking_category: 'Critical',
    guide_choking_updated: '3 ka adlaw na ang milabay',
    guide_choking_short:
      'Ila-a ang pagkabulonan ug gamita ang back blows ug abdominal thrusts aron mahaw-as ang agianan sa hangin.',
    guide_choking_full:
      'Mahitabo ang pagkabulonan kon adunay butang nga nagbabara sa agianan sa hangin ug dili makasulod ang hangin sa baga. Kusog ug lig-on nga back blows ug abdominal thrusts makatabang sa pagpagawas sa bara sa dili pa mawadaan og hinulsol ang tawo.',
    guide_choking_step1_title:
      'Siguroha kon grabe ang pagkabulonan',
    guide_choking_step1_desc:
      'Pangutan-a, “Nagkabulonan ka ba?” Ang tawo nga grabe ang pagkabulonan kasagaran dili na makasulti, makaubo, o makaginhawa ug sagad magkupot sa iyang tutunlan.',
    guide_choking_step2_title: 'Hatagi og back blows',
    guide_choking_step2_desc:
      'Barog gamay sa likod ug kilid. Suportahi ang dughan ug hatag og hangtod 5 ka kusog nga palo sa likod tali sa abaga gamit ang sakong sa imong kamot.',
    guide_choking_step3_title:
      'Hatagi og abdominal thrusts',
    guide_choking_step3_desc:
      'Kon dili gihapon mogawas ang butang, barog sa likod sa tawo, ibutang ang kamao sa ibabaw sa pusod, kupkopi sa pikas kamot, ug hugti nga puslon paluyo ug pataas hangtod 5 ka beses.',
    guide_choking_step4_title:
      'Pagbalik-balik hangtod mahaw-as o mahulog',
    guide_choking_step4_desc:
      'Balika ang 5 ka back blows ug 5 ka abdominal thrusts hangtod nga mogawas ang bara o mawadaan og hinulsol ang tawo.',
    guide_choking_step5_title:
      'Kung mawadaan og hinulsol, sugdi ang CPR',
    guide_choking_step5_desc:
      'Hinay-hinay siyang ihigda sa salog, tawag og emergency services, ug sugdi ang CPR. Tan-awa ang baba kung adunay klaro nga bara sa wala pa maghatag og hininga.',

    // ----- Severe Bleeding -----
    guide_bleeding_title:
      'Grabe nga Pagdugo ug mga Hiwa',
    guide_bleeding_category: 'Injury',
    guide_bleeding_updated: '1 ka adlaw na ang milabay',
    guide_bleeding_short:
      'Kontrolaha dayon ang pagdugo pinaagi sa lig-on nga direct pressure ug panalipdi ang tawo samtang naghulat sa tabang.',
    guide_bleeding_full:
      'Ang grabe nga pagdugo mahimong hulga sa kinabuhi kon dili dayon makontrol. Lig-on nga pagduso gamit ang limpyo nga panapton o benda ug pag-alsa sa nasamdan nga bahin makatabang sa paghinay sa pagdugo hangtod moabot ang mga propesyonal.',
    guide_bleeding_step1_title:
      'Siguroha ang kahimtang sa palibot ug panalipdi ang imong kaugalingon',
    guide_bleeding_step1_desc:
      'Tan-awa kon luwas ba nga moduol. Kon adunay guwantes o plastik nga panagang, gamita aron malikayan ang diretsong kontak sa dugo.',
    guide_bleeding_step2_title:
      'Ibutang ang direct pressure',
    guide_bleeding_step2_desc:
      'Ibutang ang limpyo nga panapton, gauze, o benda direkta sa samad ug iduso kini pag-ayo gamit ang imong kamot.',
    guide_bleeding_step3_title:
      'Padayon sa lig-on nga pressure',
    guide_bleeding_step3_desc:
      'Ayaw tangtanga ang panapton nga nabasa sa dugo; idugang lang ug laing layer sa ibabaw ug ipadayon ang pagduso.',
    guide_bleeding_step4_title: 'Ialsa kon mahimo',
    guide_bleeding_step4_desc:
      'Kon walay duda sa bali, isaka ang nasamdan nga bahin mas taas sa kasingkasing aron motabang nga mohinay ang pagdugo.',
    guide_bleeding_step5_title:
      'Pangita dayon og medikal nga tabang',
    guide_bleeding_step5_desc:
      'Tawag og emergency services kon kusog kaayo ang pagdugo, nagasilak, o dili mohupay bisan gi-pressure, o kon lalom ug dako ang samad.',

    // ----- Burns -----
    guide_burns_title: 'Paso ug Pagkainit sa Panit',
    guide_burns_category: 'Injury',
    guide_burns_updated: '3 ka adlaw na ang milabay',
    guide_burns_short:
      'Pabugnawa ang paso sa nagdagayday nga tubig, tangtanga ang masipyat nga butang, ug likayi ang mga home remedy sama sa lana o toothpaste.',
    guide_burns_full:
      'Ang paso mahimong hinungdan sa kainit, kalayo, init nga likido, kuryente, o kemikal. Dali nga pagpalamig gamit ang bugnaw (dili yelo) nga tubig makapaminus sa kasakit ug kadaot sa panit ug makapamenos sa komplikasyon.',
    guide_burns_step1_title:
      'Hunonga ang hinungdan sa paso',
    guide_burns_step1_desc:
      'Patya ang kainit o kuryente kon luwas, ilayo ang tawo sa tinubdan, ug tangtanga ang nagsugod nga nagdilaab nga sinina o alahas duol sa paso.',
    guide_burns_step2_title: 'Pabugnawa ang paso',
    guide_burns_step2_desc:
      'Ibaw-og ang nasunog nga bahin sa bugnaw (dili yelo) nga nagdagayday nga tubig sulod sa labing menos 20 ka minuto o ibutang ang bugnaw, basang compress.',
    guide_burns_step3_title: 'Panalipdi ang lugar',
    guide_burns_step3_desc:
      'Tabuni ang paso sa hilisgutan nga sterile, dili mosunod nga dressing o limpyo nga panapton. Ayaw buak-a ang mga paltos.',
    guide_burns_step4_title:
      'Likayi ang mga cream ug home remedy',
    guide_burns_step4_desc:
      'Ayaw pagbutang og mantikilya, lana, toothpaste, o yelo direkta sa paso kay makapasamot sa kadaot.',
    guide_burns_step5_title:
      'Pangita og tabang para sa grabe nga paso',
    guide_burns_step5_desc:
      'Pangita dayon og tabang kon ang paso naa sa nawong, kamot, tiil, ari, dako kaayo nga bahin sa lawas, o kung lalom, electrical, o chemical ang paso.',

    // ----- Fracture -----
    guide_fracture_title: 'Nabali nga Bukog (Fracture)',
    guide_fracture_category: 'Injury',
    guide_fracture_updated: '1 ka adlaw na ang milabay',
    guide_fracture_short:
      'I-immobilize ang nasamdan nga bahin ug likayi ang dugang nga lihok hangtod makaabot ang propesyonal nga tabang.',
    guide_fracture_full:
      'Ang fracture mahimong hinungdan sa pagkahulog, aksidente, o diretsong tama. Ang sakto nga first aid makapamenos sa kasakit ug makapugong nga mosamot ang kadaot sa palibot sa nabali nga bukog.',
    guide_fracture_step1_title:
      'Tan-awa kon adunay samad o deformity',
    guide_fracture_step1_desc:
      'Susiha kon adunay hubag, pasa, o dili natural nga pagbaluktot sa bahin. Ayaw sulayi nga ituwid ang nabali nga bukog.',
    guide_fracture_step2_title:
      'Immobilize ang nasamdan nga bahin',
    guide_fracture_step2_desc:
      'Gamita ang splint, gilangkob nga magasin, o tabla aron dili makalihok ang bahin. Gaposa sa ibabaw ug ubos sa lugar sa kadaot.',
    guide_fracture_step3_title: 'Butangi og cold pack',
    guide_fracture_step3_desc:
      'Ibutang ang yelong binalot sa panapton sa nasamdan nga bahin sulod sa hangtod 20 ka minuto aron maminusan ang hubag ug kasakit.',
    guide_fracture_step4_title:
      'Bantayi kon na-shock ang pasyente',
    guide_fracture_step4_desc:
      'Ihigda ang tawo, tabuni og habol aron init, ug bantayi kon namutla, tugnaw ug ulanon ang panit, o nagkalibog.',
    guide_fracture_step5_title:
      'Dalha dayon sa doktor o ospital',
    guide_fracture_step5_desc:
      'Dad-a sa labing duol nga emergency department o tawag og ambulansya kon delikado siyang lihokon o grabe ang kasakit.',

    // ----- Sprains & Strains -----
    guide_sprain_title: 'Sprains ug Strains',
    guide_sprain_category: 'Injury',
    guide_sprain_updated: '4 ka adlaw na ang milabay',
    guide_sprain_short:
      'Gamita ang RICE: rest, ice, compression, ug elevation aron atimanon ang kasagarang injury sa lutahan.',
    guide_sprain_full:
      'Ang sprain kay kadaot sa ligaments, samtang ang strain kay sa kaunoran o litid. Daghang banayad nga sprain ug strain ang mahimong atimanon sa balay una gamit ang rest, ice, compression, ug elevation.',
    guide_sprain_step1_title:
      'Pahuwaya ang nasamdan nga bahin',
    guide_sprain_step1_desc:
      'Hunongi ang aktibidad ug likayi ang pagbutang og bug-at o kusog sa nasamdan nga lutahan o biyas.',
    guide_sprain_step2_title: 'Butangi og yelo',
    guide_sprain_step2_desc:
      'Ibutang ang cold pack o yelong binalot sa panapton sa lugar sulod sa 15–20 ka minuto matag 2–3 ka oras sa unang adlaw.',
    guide_sprain_step3_title:
      'Gamita ang compression',
    guide_sprain_step3_desc:
      'Baloti ang lugar gamit ang elastic bandage, nga hugot apan dili sobra nga makapahinay o makapahubag sa pakiramdam.',
    guide_sprain_step4_title: 'Ialsa ang biyas',
    guide_sprain_step4_desc:
      'Isaka ang nasamdan nga bahin labaw sa lebel sa kasingkasing aron maminusan ang hubag.',
    guide_sprain_step5_title:
      'Magpacheck kon kinahanglan',
    guide_sprain_step5_desc:
      'Magpacheck kon grabe ang kasakit, dili na magamit ang lutahan, o adunay deformity o hinalang nabali.',

    // ----- Head Injury -----
    guide_head_title: 'Head Injury ug Concussion',
    guide_head_category: 'Injury',
    guide_head_updated: '5 ka adlaw na ang milabay',
    guide_head_short:
      'Bantayi ang pagkalibog, pagsusuka, o nag-grabe nga sakit sa ulo human maigo ang ulo ug pangitaa dayon og tabang kon naa.',
    guide_head_full:
      'Ang head injury mahimong gikan sa gamay nga bukol hangtod sa seryosong kadaot sa utok. Anumang pagkawala sa hinulsol, kalibog, balik-balik nga pagsusuka, o nag-grabe nga sintomas nanginahanglan og urgent nga medikal nga pag-ayo.',
    guide_head_step1_title:
      'Susiha kon motubag ang pasyente',
    guide_head_step1_desc:
      'Istoryahi ang tawo, pangutan-a og yano nga pangutana, ug tan-awa kon normal siya motubag.',
    guide_head_step2_title:
      'Tan-awa ang mga danger signs',
    guide_head_step2_desc:
      'Bantayi ang kalibog, balik-balik nga pagsusuka, grabe o nag-grabe nga sakit sa ulo, seizure, kahuyang, o dili patas nga gidak-on sa pupil.',
    guide_head_step3_title: 'Ayaw siya palihoka og sobra',
    guide_head_step3_desc:
      'Ihigda ang tawo ug likayi ang paglihok sa liog kon nagduda og kadaot sa liog o spine.',
    guide_head_step4_title:
      'Butangi og cold pack sa bukol',
    guide_head_step4_desc:
      'Alayon nga ibutang ang bugnaw nga compress nga binalot sa panapton sa banayad nga bukol aron maminusan ang hubag.',
    guide_head_step5_title:
      'Dalha o tawag og tabang medikal',
    guide_head_step5_desc:
      'Tawag og emergency services o adtoa ang ospital kon adunay danger signs o dili moayo ang mga sintomas.',

    // ----- Hypothermia -----
    guide_hypo_title:
      'Hypothermia ug Pagkababad sa Tugnao',
    guide_hypo_category: 'Medical',
    guide_hypo_updated: '2 ka semana na ang milabay',
    guide_hypo_short:
      'Hinay-hinay nga painita ang tawo, tangtanga ang basang sinina, ug pangitaa og tabang kon nagkalibog o nagakawanggaw.',
    guide_hypo_full:
      'Mahitabo ang hypothermia kon grabe kaubos ang temperatura sa lawas, kasagaran tungod sa basa o tugnaw nga palibot. Hinay ug mahuyang nga pagpainit ug dali nga medikal nga tabang makalikay sa seryosong komplikasyon.',
    guide_hypo_step1_title:
      'Balhina sa init ug uga nga lugar',
    guide_hypo_step1_desc:
      'Panangliti ang tawo gikan sa hangin ug katugnaw ug tangtanga ang basang sinina, ilisan og uga ug daghang layer.',
    guide_hypo_step2_title:
      'Hinay-hinay nga painita ang lawas',
    guide_hypo_step2_desc:
      'Gamita ang habol, mainit nga sinina, o kainit sa lawas. Pahinungod una sa dughan, liog, ug ulo.',
    guide_hypo_step3_title:
      'Hatagi og inita nga ilimnon kon alerto',
    guide_hypo_step3_desc:
      'Kon siya buhi og klaro ug kaya molunok, hatagi og inita, tam-is, ug dili alcoholic nga ilimnon.',
    guide_hypo_step4_title:
      'Likayi ang grabe ka init nga direkta',
    guide_hypo_step4_desc:
      'Ayaw gamita ang grabe ka init nga tubig, heating pad, o kusog nga pagmasahe sa panit kay makadaot.',
    guide_hypo_step5_title:
      'Pangitaa og tabang medikal',
    guide_hypo_step5_desc:
      'Tawag og emergency services kon nagkalibog, hinay kaayo, hinay ang gininhawa, o dili dayon motubag ang kahimtang.',

    // ----- Drowning -----
    guide_drowning_title:
      'Pagkalumos ug Halos Pagkalumos',
    guide_drowning_category: 'Critical',
    guide_drowning_updated: '2 ka semana na ang milabay',
    guide_drowning_short:
      'Siguroha una ang kaluwasan, kuhaa sa tubig kon mahimo, sugdi ang CPR kon dili siya gininhawa, ug tawag og emergency.',
    guide_drowning_full:
      'Ang pagkalumos mahimong mahitabo nga paspas ug hilum. Luwas nga pagluwas, dayong CPR kon gikinahanglan, ug kusog nga pagtawag sa emergency services maoy yawe sa kaluwasan.',
    guide_drowning_step1_title:
      'Siguroha ang imong kaugalingong kaluwasan',
    guide_drowning_step1_desc:
      'Ayaw pagsulod sa delikadong tubig. Gamita ang flotation device o abuta gamit ang pole o pisi kon mahimo.',
    guide_drowning_step2_title: 'Kuhaa gikan sa tubig',
    guide_drowning_step2_desc:
      'Kon luwas na, dad-a ang tawo sa lig-on nga yuta ug ihigda siya nga nakatihaya.',
    guide_drowning_step3_title:
      'Susiha ang gininhawa ug kahimtang',
    guide_drowning_step3_desc:
      'Kon dili normal ang gininhawa, tawag dayon og emergency services ug sugdi ang CPR.',
    guide_drowning_step4_title:
      'Hatagi og rescue breaths',
    guide_drowning_step4_desc:
      'Sa pagkalumos, importante kaayo ang rescue breaths. Hatagi og 2 ka hininga, unya ipadayon ang CPR cycles sumala sa training.',
    guide_drowning_step5_title:
      'Bantayi bisan og nakabawi na siya',
    guide_drowning_step5_desc:
      'Magpacheck sa doktor pagkatapos sa bisan unsang near‑drowning kay mahimo pang adunay komplikasyon sa baga.',

    // ----- Seizures -----
    guide_seizure_title:
      'Seizures ug Pagkikig',
    guide_seizure_category: 'Medical',
    guide_seizure_updated: '2 ka semana na ang milabay',
    guide_seizure_short:
      'Panalipdi ang tawo gikan sa kadaot, ayaw siya pugngi o butangi og bisan unsa sa baba, ug timnaa ang gitas-on sa seizure.',
    guide_seizure_full:
      'Ang seizures nagdala og dili kontroladong lihok ug kausaban sa kahimtang sa hunahuna. Importante ang pagpanalipod sa ulo, paghinlo sa palibot sa makadaot nga butang, ug kahibalo kon kanus-a motawag og tabang.',
    guide_seizure_step1_title:
      'Puy-i og kalma ug i-timing ang seizure',
    guide_seizure_step1_desc:
      'Timnaa kung kanus-a nagsugod ug kung pilay minutos nagpadayon ang seizure.',
    guide_seizure_step2_title:
      'Panalipdi gikan sa kadaot',
    guide_seizure_step2_desc:
      'Kuhaa ang mga butang nga makasamad sa palibot, butangi og malambot nga sapin ang ulo, ug luwagi ang higot nga sinina sa liog.',
    guide_seizure_step3_title:
      'Ayaw pugngi o butangi og butang sa baba',
    guide_seizure_step3_desc:
      'Pasagdi nga mahuman ang seizure. Ayaw siya pugngi og kusog ug ayaw butangi og bisan unsa sa iyang baba.',
    guide_seizure_step4_title:
      'Ibutang sa recovery position human sa seizure',
    guide_seizure_step4_desc:
      'Inig hunong sa lihok ug normal na ang gininhawa, hinay-hinay siyang ipaling sa kilid kon luwas.',
    guide_seizure_step5_title:
      'Tawag og tabang kon gikinahanglan',
    guide_seizure_step5_desc:
      'Tawag og emergency kon molapas sa 5 minutos ang seizure, magbalik-balik, o lisod siyag gininhawa pagkahuman.',

    // ----- Stroke -----
    guide_stroke_title: 'Stroke (Atake sa Utok)',
    guide_stroke_category: 'Medical',
    guide_stroke_updated: '3 ka semana na ang milabay',
    guide_stroke_short:
      'Gamita ang FAST: Face drooping, Arm weakness, Speech difficulty, Time nga motawag og emergency services.',
    guide_stroke_full:
      'Mahitabo ang stroke kon nababagan ang dugo nga modagayday sa bahin sa utok o mabuak ang ugat. Ang paspas nga pagkaila sa sintomas ug dali nga pagtawag sa emergency services dakong tabang sa pagluwas ug pag-ayo.',
    guide_stroke_step1_title:
      'Susiha gamit ang FAST',
    guide_stroke_step1_desc:
      'Face: pangitaa siyag pahiyom; Arm: paangata ang duha ka bukton; Speech: paulit-a og yano nga hugpong sa mga pulong ug tan-awa kon nagkalabi o naglisod.',
    guide_stroke_step2_title:
      'Tawag dayon og emergency services',
    guide_stroke_step2_desc:
      'Ayaw hulata nga moayo pa ang sintomas. Hinanglan og dali nga pag-atiman sa ospital.',
    guide_stroke_step3_title:
      'Timnaa kon kanus-a nagsugod ang sintomas',
    guide_stroke_step3_desc:
      'Isulat kung kanus-a kataposang nakita nga normal ang tawo. Importante kaayo kini sa plano sa tambal.',
    guide_stroke_step4_title:
      'Himua siyang luwas ug komportable',
    guide_stroke_step4_desc:
      'Tabangi nga malingkod o mahigda sa komportableng posisyon, luwagi ang higot nga sinina, ug kalmaha siya.',
    guide_stroke_step5_title:
      'Bantayi ang gininhawa ug panimuot',
    guide_stroke_step5_desc:
      'Andama nga magsugod og CPR kon kalit siyang mohawa sa hinulsol o mohungaw ang gininhawa.',

    // ----- Typhoon -----
    guide_typhoon_title: 'Andam sa Bagyo',
    guide_typhoon_category: 'Disaster',
    guide_typhoon_updated: '1 ka semana na ang milabay',
    guide_typhoon_short:
      'Andama ang balay, emergency kit, ug evacuation plan sa dili pa moabot ang bagyo.',
    guide_typhoon_full:
      'Ang bagyo nagdala og kusog nga hangin, kusog nga ulan, storm surge, ug pagbaha. Ang pag-andam sa wala pa ang bagyo dako kaayong tabang aron maminusan ang risgo sa kinabuhi ug kabtangan.',
    guide_typhoon_step1_title:
      'Andama ang emergency kit',
    guide_typhoon_step1_desc:
      'Andama ang tubig, pagkaong dili dali madaot, flashlight, baterya, radyo, tambal, ug importante nga dokumento sa usa ka waterproof nga bag.',
    guide_typhoon_step2_title:
      'Siguroha ang balay',
    guide_typhoon_step2_desc:
      'Ibutang sulod ang mga butang nga pwede liparon sa hangin, lig-ona ang mga bintana kon mahimo, ug hibaloa kon giunsa pagpatay ang gas ug kuryente.',
    guide_typhoon_step3_title:
      'Ilaila ang mga evacuation route',
    guide_typhoon_step3_desc:
      'Ilaila ang labing duol nga evacuation center ug labing luwas nga agianan, labi na kon nagpuyo sa ubos o duol sa baybayon.',
    guide_typhoon_step4_title:
      'Sunda ang opisyal nga pahibalo',
    guide_typhoon_step4_desc:
      'Sunda ang mga update gikan sa lokal nga panggamhanan, PAGASA, o NDRRMC. Dali nga lumikas kon gisugo.',

  },
};



// ---------- LiveMap component ----------

const LiveMap: React.FC = () => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const leafletMapRef = useRef<Leaflet.Map | null>(null);

  useEffect(() => {
    let isMounted = true;

    const initMap = async () => {
      const L = await import('leaflet'); // dynamic import for client-side only [web:28]

      if (!mapContainerRef.current || !isMounted || leafletMapRef.current) return;

      const map = L.map(mapContainerRef.current).setView([10.3103, 123.9494], 13);
      leafletMapRef.current = map;

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap contributors',
      }).addTo(map);

      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            if (!isMounted || !leafletMapRef.current) return;
            const lat = pos.coords.latitude;
            const lng = pos.coords.longitude;

            leafletMapRef.current.setView([lat, lng], 15);

            L.marker([lat, lng])
              .addTo(leafletMapRef.current)
              .bindPopup('You are here')
              .openPopup();
          },
          () => {
            // keep default center
          },
        );
      }
    };

    initMap();

    return () => {
      isMounted = false;
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null as any;
      }
    };
  }, []);

  return (
    <div className="rounded-xl overflow-hidden shadow-md">
      <div
        ref={mapContainerRef}
        style={{ height: '260px', width: '100%' }}
        className="bg-gray-200"
      />
    </div>
  );
};

// ---------- Main App ----------

const EmergencyApp = () => {
  const [activeTab, setActiveTab] = useState<
    'home' | 'guides' | 'map' | 'history' | 'settings'
  >('home');
  const [sosActive, setSosActive] = useState(false);
  const [selectedGuide, setSelectedGuide] = useState<FirstAidGuide | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [lastSharedLocation, setLastSharedLocation] = useState<string | null>(null);
  const [disasterAlerts, setDisasterAlerts] = useState<string[]>([]);
  const [emergencyHistory, setEmergencyHistory] = useState<EmergencyHistoryItem[]>([]);
  const [guideHistory, setGuideHistory] = useState<GuideHistoryItem[]>([]);
  const [historyFilter, setHistoryFilter] = useState<'all' | 'sos' | 'calls' | 'disaster'>(
    'all',
  );
  const [language, setLanguage] = useState<Language>('en');

  const t = translations[language];

  // --- Guides data derived from translations so they auto-switch language. [web:36]

const firstAidGuides: FirstAidGuide[] = [
  // CPR (already in your previous code)
  {
    id: 'cpr',
    title: t.guide_cpr_title,
    category: 'Critical',
    updated: '2 days ago',
    shortDescription: t.guide_cpr_short,
    fullDescription: t.guide_cpr_full,
    steps: [
      { stepNumber: 1, title: t.guide_cpr_step1_title, description: t.guide_cpr_step1_desc },
      { stepNumber: 2, title: t.guide_cpr_step2_title, description: t.guide_cpr_step2_desc },
      { stepNumber: 3, title: t.guide_cpr_step3_title, description: t.guide_cpr_step3_desc },
      { stepNumber: 4, title: t.guide_cpr_step4_title, description: t.guide_cpr_step4_desc },
      { stepNumber: 5, title: t.guide_cpr_step5_title, description: t.guide_cpr_step5_desc },
    ],
    thumbnail: 'https://img.youtube.com/vi/2PngCv7NjaI/hqdefault.jpg',
    videoUrl: 'https://www.youtube.com/watch?v=2PngCv7NjaI',
  },

  // Choking
  {
    id: 'choking-adult',
    title: t.guide_choking_title,
    category: t.guide_choking_category as FirstAidGuide['category'],
    updated: t.guide_choking_updated,
    shortDescription: t.guide_choking_short,
    fullDescription: t.guide_choking_full,
    steps: [
      { stepNumber: 1, title: t.guide_choking_step1_title, description: t.guide_choking_step1_desc },
      { stepNumber: 2, title: t.guide_choking_step2_title, description: t.guide_choking_step2_desc },
      { stepNumber: 3, title: t.guide_choking_step3_title, description: t.guide_choking_step3_desc },
      { stepNumber: 4, title: t.guide_choking_step4_title, description: t.guide_choking_step4_desc },
      { stepNumber: 5, title: t.guide_choking_step5_title, description: t.guide_choking_step5_desc },
    ],
    thumbnail: 'https://img.youtube.com/vi/SwJlZnu05Cw/hqdefault.jpg',
    videoUrl: 'https://www.youtube.com/watch?v=SwJlZnu05Cw',
  },

  // Severe Bleeding & Cuts
  {
    id: 'severe-bleeding',
    title: t.guide_bleeding_title,
    category: t.guide_bleeding_category as FirstAidGuide['category'],
    updated: t.guide_bleeding_updated,
    shortDescription: t.guide_bleeding_short,
    fullDescription: t.guide_bleeding_full,
    steps: [
      { stepNumber: 1, title: t.guide_bleeding_step1_title, description: t.guide_bleeding_step1_desc },
      { stepNumber: 2, title: t.guide_bleeding_step2_title, description: t.guide_bleeding_step2_desc },
      { stepNumber: 3, title: t.guide_bleeding_step3_title, description: t.guide_bleeding_step3_desc },
      { stepNumber: 4, title: t.guide_bleeding_step4_title, description: t.guide_bleeding_step4_desc },
      { stepNumber: 5, title: t.guide_bleeding_step5_title, description: t.guide_bleeding_step5_desc },
    ],
    thumbnail: 'https://img.youtube.com/vi/qrbiUlcUZn0/hqdefault.jpg',
    videoUrl: 'https://www.youtube.com/watch?v=qrbiUlcUZn0',
  },

  // Burns and Scalds
  {
    id: 'burns',
    title: t.guide_burns_title,
    category: t.guide_burns_category as FirstAidGuide['category'],
    updated: t.guide_burns_updated,
    shortDescription: t.guide_burns_short,
    fullDescription: t.guide_burns_full,
    steps: [
      { stepNumber: 1, title: t.guide_burns_step1_title, description: t.guide_burns_step1_desc },
      { stepNumber: 2, title: t.guide_burns_step2_title, description: t.guide_burns_step2_desc },
      { stepNumber: 3, title: t.guide_burns_step3_title, description: t.guide_burns_step3_desc },
      { stepNumber: 4, title: t.guide_burns_step4_title, description: t.guide_burns_step4_desc },
      { stepNumber: 5, title: t.guide_burns_step5_title, description: t.guide_burns_step5_desc },
    ],
    thumbnail: 'https://img.youtube.com/vi/aVts0vsswCQ/hqdefault.jpg',
    videoUrl: 'https://www.youtube.com/watch?v=aVts0vsswCQ',
  },

  // Broken Bones (Fractures)
  {
    id: 'fracture',
    title: t.guide_fracture_title,
    category: t.guide_fracture_category as FirstAidGuide['category'],
    updated: t.guide_fracture_updated,
    shortDescription: t.guide_fracture_short,
    fullDescription: t.guide_fracture_full,
    steps: [
      { stepNumber: 1, title: t.guide_fracture_step1_title, description: t.guide_fracture_step1_desc },
      { stepNumber: 2, title: t.guide_fracture_step2_title, description: t.guide_fracture_step2_desc },
      { stepNumber: 3, title: t.guide_fracture_step3_title, description: t.guide_fracture_step3_desc },
      { stepNumber: 4, title: t.guide_fracture_step4_title, description: t.guide_fracture_step4_desc },
      { stepNumber: 5, title: t.guide_fracture_step5_title, description: t.guide_fracture_step5_desc },
    ],
    thumbnail: 'https://img.youtube.com/vi/07CuJMoKcC0/hqdefault.jpg',
    videoUrl: 'https://www.youtube.com/shorts/07CuJMoKcC0',
  },

  // Sprains and Strains
  {
    id: 'sprain-strain',
    title: t.guide_sprain_title,
    category: t.guide_sprain_category as FirstAidGuide['category'],
    updated: t.guide_sprain_updated,
    shortDescription: t.guide_sprain_short,
    fullDescription: t.guide_sprain_full,
    steps: [
      { stepNumber: 1, title: t.guide_sprain_step1_title, description: t.guide_sprain_step1_desc },
      { stepNumber: 2, title: t.guide_sprain_step2_title, description: t.guide_sprain_step2_desc },
      { stepNumber: 3, title: t.guide_sprain_step3_title, description: t.guide_sprain_step3_desc },
      { stepNumber: 4, title: t.guide_sprain_step4_title, description: t.guide_sprain_step4_desc },
      { stepNumber: 5, title: t.guide_sprain_step5_title, description: t.guide_sprain_step5_desc },
    ],
    thumbnail: 'https://img.youtube.com/vi/BZMD3cfyjVI/hqdefault.jpg',
    videoUrl: 'https://www.youtube.com/watch?v=BZMD3cfyjVI',
  },

  // Head Injury & Concussion
  {
    id: 'head-injury',
    title: t.guide_head_title,
    category: t.guide_head_category as FirstAidGuide['category'],
    updated: t.guide_head_updated,
    shortDescription: t.guide_head_short,
    fullDescription: t.guide_head_full,
    steps: [
      { stepNumber: 1, title: t.guide_head_step1_title, description: t.guide_head_step1_desc },
      { stepNumber: 2, title: t.guide_head_step2_title, description: t.guide_head_step2_desc },
      { stepNumber: 3, title: t.guide_head_step3_title, description: t.guide_head_step3_desc },
      { stepNumber: 4, title: t.guide_head_step4_title, description: t.guide_head_step4_desc },
      { stepNumber: 5, title: t.guide_head_step5_title, description: t.guide_head_step5_desc },
    ],
    thumbnail: 'https://img.youtube.com/vi/qohZjnn4p_A/hqdefault.jpg',
    videoUrl: 'https://www.youtube.com/watch?v=qohZjnn4p_A',
  },

  // Hypothermia & Cold Exposure
  {
    id: 'hypothermia',
    title: t.guide_hypo_title,
    category: t.guide_hypo_category as FirstAidGuide['category'],
    updated: t.guide_hypo_updated,
    shortDescription: t.guide_hypo_short,
    fullDescription: t.guide_hypo_full,
    steps: [
      { stepNumber: 1, title: t.guide_hypo_step1_title, description: t.guide_hypo_step1_desc },
      { stepNumber: 2, title: t.guide_hypo_step2_title, description: t.guide_hypo_step2_desc },
      { stepNumber: 3, title: t.guide_hypo_step3_title, description: t.guide_hypo_step3_desc },
      { stepNumber: 4, title: t.guide_hypo_step4_title, description: t.guide_hypo_step4_desc },
      { stepNumber: 5, title: t.guide_hypo_step5_title, description: t.guide_hypo_step5_desc },
    ],
    thumbnail: 'https://img.youtube.com/vi/Sf85qfJUNfc/hqdefault.jpg',
    videoUrl: 'https://www.youtube.com/watch?v=Sf85qfJUNfc',
  },

  // Drowning & Near‑Drowning
  {
    id: 'drowning',
    title: t.guide_drowning_title,
    category: t.guide_drowning_category as FirstAidGuide['category'],
    updated: t.guide_drowning_updated,
    shortDescription: t.guide_drowning_short,
    fullDescription: t.guide_drowning_full,
    steps: [
      { stepNumber: 1, title: t.guide_drowning_step1_title, description: t.guide_drowning_step1_desc },
      { stepNumber: 2, title: t.guide_drowning_step2_title, description: t.guide_drowning_step2_desc },
      { stepNumber: 3, title: t.guide_drowning_step3_title, description: t.guide_drowning_step3_desc },
      { stepNumber: 4, title: t.guide_drowning_step4_title, description: t.guide_drowning_step4_desc },
      { stepNumber: 5, title: t.guide_drowning_step5_title, description: t.guide_drowning_step5_desc },
    ],
    thumbnail: 'https://img.youtube.com/vi/Hlrbio-NpxQ/hqdefault.jpg',
    videoUrl: 'https://www.youtube.com/watch?v=Hlrbio-NpxQ',
  },

  // Seizures & Convulsions
  {
    id: 'seizure',
    title: t.guide_seizure_title,
    category: t.guide_seizure_category as FirstAidGuide['category'],
    updated: t.guide_seizure_updated,
    shortDescription: t.guide_seizure_short,
    fullDescription: t.guide_seizure_full,
    steps: [
      { stepNumber: 1, title: t.guide_seizure_step1_title, description: t.guide_seizure_step1_desc },
      { stepNumber: 2, title: t.guide_seizure_step2_title, description: t.guide_seizure_step2_desc },
      { stepNumber: 3, title: t.guide_seizure_step3_title, description: t.guide_seizure_step3_desc },
      { stepNumber: 4, title: t.guide_seizure_step4_title, description: t.guide_seizure_step4_desc },
      { stepNumber: 5, title: t.guide_seizure_step5_title, description: t.guide_seizure_step5_desc },
    ],
    thumbnail: 'https://img.youtube.com/vi/Ovsw7tdneqE/hqdefault.jpg',
    videoUrl: 'https://www.youtube.com/watch?v=Ovsw7tdneqE',
  },

  // Stroke (Brain Attack)
  {
    id: 'stroke',
    title: t.guide_stroke_title,
    category: t.guide_stroke_category as FirstAidGuide['category'],
    updated: t.guide_stroke_updated,
    shortDescription: t.guide_stroke_short,
    fullDescription: t.guide_stroke_full,
    steps: [
      { stepNumber: 1, title: t.guide_stroke_step1_title, description: t.guide_stroke_step1_desc },
      { stepNumber: 2, title: t.guide_stroke_step2_title, description: t.guide_stroke_step2_desc },
      { stepNumber: 3, title: t.guide_stroke_step3_title, description: t.guide_stroke_step3_desc },
      { stepNumber: 4, title: t.guide_stroke_step4_title, description: t.guide_stroke_step4_desc },
      { stepNumber: 5, title: t.guide_stroke_step5_title, description: t.guide_stroke_step5_desc },
    ],
    thumbnail: 'https://img.youtube.com/vi/miZ9eQO6kpI/hqdefault.jpg',
    videoUrl: 'https://www.youtube.com/watch?v=miZ9eQO6kpI',
  },

  // Typhoon Preparedness
  {
    id: 'typhoon',
    title: t.guide_typhoon_title,
    category: t.guide_typhoon_category as FirstAidGuide['category'],
    updated: t.guide_typhoon_updated,
    shortDescription: t.guide_typhoon_short,
    fullDescription: t.guide_typhoon_full,
    steps: [
      { stepNumber: 1, title: t.guide_typhoon_step1_title, description: t.guide_typhoon_step1_desc },
      { stepNumber: 2, title: t.guide_typhoon_step2_title, description: t.guide_typhoon_step2_desc },
      { stepNumber: 3, title: t.guide_typhoon_step3_title, description: t.guide_typhoon_step3_desc },
      { stepNumber: 4, title: t.guide_typhoon_step4_title, description: t.guide_typhoon_step4_desc },
    ],
    thumbnail: 'https://img.youtube.com/vi/YZEB5wVWaLw/hqdefault.jpg',
    videoUrl: 'https://www.youtube.com/watch?v=YZEB5wVWaLw',
  },
];


  // --- Load history from backend ---

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const res = await fetch('http://localhost:3000/api/history');
        if (!res.ok) return;

        const data = await res.json();

        const mappedEmergency: EmergencyHistoryItem[] = (data.emergencyHistory ?? []).map(
          (e: any) => {
            const type = (e.type as string) || 'SOS Alert';
            const typeLower = type.toLowerCase();

            let inferredCategory: EmergencyHistoryItem['category'] = 'other';
            if (typeLower.includes('sos')) inferredCategory = 'sos';
            else if (typeLower.includes('call')) inferredCategory = 'call';
            else if (typeLower.includes('alert') || typeLower.includes('disaster'))
              inferredCategory = 'disaster';

            return {
              icon: AlertTriangle,
              time: e.time ?? (e.date ? new Date(e.date).toLocaleTimeString() : ''),
              id: e.id ?? Date.now() + Math.random(),
              type,
              date: e.date ?? new Date().toISOString(),
              location: e.location ?? 'Unknown location',
              status: e.status ?? 'Resolved',
              responders: e.responders ?? 'N/A',
              color: (e.color as any) ?? 'red',
              createdAt: e.createdAt ?? e.date ?? new Date().toISOString(),
              category: (e.category as any) ?? inferredCategory,
            };
          },
        );

        setEmergencyHistory(mappedEmergency);
        setGuideHistory(data.guideHistory ?? []);
      } catch (err) {
        console.error('Failed to load history', err);
      }
    };

    loadHistory();
  }, []);

  const emergencyContacts = [
    { name: 'PNP Emergency', number: '+639123456789', type: 'Police' },
    { name: 'BFP Fire', number: '+639123456789', type: 'Fire' },
    { name: 'Red Cross', number: '+639123456789', type: 'Medical' },
    { name: 'NDRRMC', number: '+639123456789', type: 'Disaster' },
  ];

  const handleQuickDial = (number: string) => {
    window.location.href = `tel:${number}`;
  };

  const handleSOSPress = async () => {
    setSosActive(true);

    const now = new Date();
    const newItem: EmergencyHistoryItem = {
      icon: AlertTriangle,
      time: now.toLocaleTimeString(),
      id: Date.now(),
      type: 'SOS Alert',
      date: now.toISOString(),
      location: 'Lapu-Lapu City, Cebu',
      status: 'Resolved',
      responders: 'PNP Emergency, Red Cross',
      color: 'red',
      createdAt: now.toISOString(),
      category: 'sos',
    };

    setEmergencyHistory((prev) => [newItem, ...prev]);

    try {
      await fetch('http://localhost:3000/api/history/emergency', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newItem),
      });
    } catch (err) {
      console.error('Failed to save emergency history', err);
    } finally {
      setSosActive(false);
      alert(t.sos_sent);
    }
  };

  const handleShareLocation = () => {
    if (!navigator.geolocation) {
      alert(t.geo_notSupported);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = `${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(
          5,
        )}`;
        setLastSharedLocation(coords);
        alert(`Location shared (simulation): ${coords}`);
      },
      () => {
        alert(t.geo_unableLocation);
      },
    );
  };

  const handleOpenGuide = async (guide: FirstAidGuide) => {
    setSelectedGuide(guide);
    const now = new Date();

    const newItem: GuideHistoryItem = {
      id: Date.now(),
      guideId: guide.id,
      guideTitle: guide.title,
      viewedAt: now.toISOString(),
      createdAt: now.toISOString(),
    };

    setGuideHistory((prev) => [newItem, ...prev]);

    try {
      await fetch('http://localhost:3000/api/history/guide', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newItem),
      });
    } catch (err) {
      console.error('Failed to save guide history', err);
    }
  };

  const handleFetchDisasterAlerts = () => {
    if (!navigator.geolocation) {
      alert(t.geo_notSupported);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;

          const resp = await fetch(`/api/alerts?lat=${lat}&lng=${lng}`);
          if (!resp.ok) {
            throw new Error('Failed to fetch alerts');
          }

          const data = await resp.json();

          const alerts = (data.alerts || []).map(
            (a: any) =>
              `${a.title}${a.source ? ` (${a.source})` : ''} – ${a.description}`,
          );

          setDisasterAlerts(alerts);

          if (!alerts.length) {
            alert(t.alerts_noActive);
          } else {
            alert(t.alerts_loaded);
          }
        } catch (err) {
          console.error(err);
          alert(t.alerts_failed);
        }
      },
      () => {
        alert(t.geo_unableLocationAlerts);
      },
    );
  };

  // ---------- Render helpers ----------

  const renderHome = () => (
    <div className="space-y-6">
      <div className="flex justify-center pt-8 pb-4">
        <button
          onClick={handleSOSPress}
          className={`w-48 h-48 rounded-full font-bold text-2xl shadow-2xl transition-all transform ${
            sosActive
              ? 'bg-red-700 scale-95 animate-pulse'
              : 'bg-gradient-to-br from-red-500 to-red-600 hover:scale-105'
          } text-white flex flex-col items-center justify-center`}
        >
          <AlertTriangle size={48} className="mb-2" />
          {sosActive ? t.home_sending : t.home_sos}
        </button>
      </div>

      {sosActive && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
          <p className="text-red-800 font-semibold">{t.home_alertSentTitle}</p>
          <p className="text-red-600 text-sm mt-1">{t.home_alertSentBody}</p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={handleShareLocation}
          className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg text-left"
        >
          <MapPin size={32} className="mb-3" />
          <h3 className="font-semibold text-lg">{t.home_shareLocationTitle}</h3>
          <p className="text-sm opacity-90 mt-1">{t.home_shareLocationBody}</p>
        </button>

        <button
          onClick={handleFetchDisasterAlerts}
          className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white shadow-lg text-left"
        >
          <Bell size={32} className="mb-3" />
          <h3 className="font-semibold text-lg">{t.home_disasterAlertsTitle}</h3>
          <p className="text-sm opacity-90 mt-1">{t.home_disasterAlertsBody}</p>
        </button>
      </div>

      {lastSharedLocation && (
        <p className="text-xs text-gray-600">
          {t.home_lastSharedLocation}: {lastSharedLocation}
        </p>
      )}

      {disasterAlerts.length > 0 && (
        <div className="bg-white rounded-xl shadow-md p-4">
          <h4 className="font-semibold text-gray-800 mb-2">
            {t.home_latestDisasterAlerts}
          </h4>
          <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
            {disasterAlerts.map((a, i) => (
              <li key={i}>{a}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="font-bold text-xl mb-4 text-gray-800">{t.home_quickDial}</h3>
        <div className="space-y-3">
          {emergencyContacts.map((contact, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div>
                <p className="font-semibold text-gray-800">{contact.name}</p>
                <p className="text-sm text-gray-500">
                  {contact.type} • {contact.number}
                </p>
              </div>
              <button
                onClick={() => handleQuickDial(contact.number)}
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2"
              >
                <Phone size={18} />
                <span className="text-xs">{t.home_call}</span>
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderGuides = () => {
    const normalizedSearch = searchTerm.toLowerCase().trim();

    const filteredGuides = normalizedSearch
      ? firstAidGuides.filter((guide) => {
          const title = guide.title.toLowerCase();
          const category = guide.category.toLowerCase();
          const shortDesc = guide.shortDescription.toLowerCase();
          const fullDesc = guide.fullDescription.toLowerCase();

          return (
            title.includes(normalizedSearch) ||
            category.includes(normalizedSearch) ||
            shortDesc.includes(normalizedSearch) ||
            fullDesc.includes(normalizedSearch)
          );
        })
      : firstAidGuides;

    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white shadow-lg">
          <h2 className="text-2xl font-bold mb-2">{t.guides_title}</h2>
          <p className="text-blue-100">{t.guides_subtitle}</p>
        </div>

        <div className="relative">
          <Search className="absolute left-4 top-3.5 text-gray-400" size={20} />
          <input
            type="text"
            placeholder={t.guides_searchPlaceholder}
            className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder:text-gray-400"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <p className="text-xs text-gray-500">
          {t.guides_showing} {filteredGuides.length} {t.guides_of}{' '}
          {firstAidGuides.length} {t.guides_guides}
        </p>

        <div className="space-y-3">
          {filteredGuides.map((guide) => (
            <button
              key={guide.id}
              onClick={() => handleOpenGuide(guide)}
              className="w-full text-left bg-white rounded-xl shadow-md p-5 hover:shadow-lg transition-shadow cursor-pointer"
            >
              <div className="flex items-start gap-4 mb-3">
                {guide.thumbnail && (
                  <div className="w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
                    <img
                      src={guide.thumbnail}
                      alt={guide.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="flex-1">
                  <h3 className="font-semibold text-lg text-gray-800 mb-1">
                    {guide.title}
                  </h3>
                  <div className="flex items-center gap-3 text-sm mb-2">
                    <span
                      className={`px-3 py-1 rounded-full font-medium ${
                        guide.category === 'Critical'
                          ? 'bg-red-100 text-red-700'
                          : guide.category === 'Injury'
                          ? 'bg-orange-100 text-orange-700'
                          : guide.category === 'Disaster'
                          ? 'bg-purple-100 text-purple-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}
                    >
                      {guide.category}
                    </span>
                    <span className="text-gray-500">
                      {t.guides_updated} {guide.updated}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {guide.shortDescription}
                  </p>
                </div>
                <PlayCircle className="text-blue-500 flex-shrink-0 ml-3" size={24} />
              </div>
            </button>
          ))}

          {filteredGuides.length === 0 && (
            <p className="text-sm text-gray-500 text-center py-4">{t.guides_none}</p>
          )}
        </div>

        {selectedGuide && (
          <div
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/40"
            onClick={() => setSelectedGuide(null)}
          >
            <div
              className="w-full max-w-md bg-white rounded-t-2xl p-5 max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-bold text-gray-800">
                  {selectedGuide.title}
                </h3>
                <button
                  onClick={() => setSelectedGuide(null)}
                  className="p-1 rounded-full hover:bg-gray-100"
                >
                  <XCircle className="text-gray-500" size={22} />
                </button>
              </div>

              {selectedGuide.thumbnail && (
                <div className="mb-4">
                  <div className="relative w-full h-48 rounded-xl overflow-hidden bg-gray-100">
                    <img
                      src={selectedGuide.thumbnail}
                      alt={selectedGuide.title}
                      className="w-full h-full object-cover"
                    />
                    <a
                      href={selectedGuide.videoUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/50 transition-all"
                    >
                      <PlayCircle className="text-white" size={48} />
                    </a>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{t.guides_thumbHint}</p>
                </div>
              )}

              <p className="text-sm text-gray-700 mb-4">
                {selectedGuide.fullDescription}
              </p>

              <h4 className="text-sm font-semibold text-gray-800 mb-2">
                {t.guides_stepTitle}
              </h4>
              <div className="space-y-2">
                {selectedGuide.steps.map((step) => (
                  <div
                    key={step.stepNumber}
                    className="bg-gray-50 border border-gray-100 rounded-lg p-3"
                  >
                    <p className="text-xs font-semibold text-blue-600 mb-1">
                      {t.guides_step} {step.stepNumber}: {step.title}
                    </p>
                    <p className="text-sm text-gray-700">{step.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderMap = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-green-600 to-teal-600 rounded-xl p-6 text-white shadow-lg">
        <h2 className="text-2xl font-bold mb-2">{t.map_title}</h2>
        <p className="text-green-100">{t.map_subtitle}</p>
      </div>

      <LiveMap />

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-xl p-5 shadow-md">
          <h4 className="font-semibold text-gray-800 mb-2">
            {t.map_evacRoutesTitle}
          </h4>
          <p className="text-sm text-gray-600">{t.map_evacRoutesBody}</p>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-md">
          <h4 className="font-semibold text-gray-800 mb-2">
            {t.map_hazardTitle}
          </h4>
          <p className="text-sm text-gray-600">{t.map_hazardBody}</p>
        </div>
      </div>
    </div>
  );

  const combinedHistory: HistoryEvent[] = [
    ...emergencyHistory.map((e) => ({
      id: e.id,
      kind: e.category,
      icon: e.icon,
      title: e.type,
      description: `${t.history_respondersPrefix} ${e.responders}`,
      date: e.date,
      location: e.location,
      status: e.status,
      responders: e.responders,
    })),
    ...guideHistory.map((g) => ({
      id: g.id,
      kind: 'guide' as HistoryEventKind,
      icon: Book,
      title: g.guideTitle,
      description: 'Viewed first-aid guide',
      date: g.viewedAt,
      location: undefined,
      status: undefined,
      responders: undefined,
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const sosCount = combinedHistory.filter(
    (e) => e.kind === 'sos' || e.title.toLowerCase().includes('sos'),
  ).length;

  const filteredHistory = combinedHistory.filter((event) => {
    if (historyFilter === 'all') return true;
    if (historyFilter === 'sos') return event.kind === 'sos';
    if (historyFilter === 'calls') return event.kind === 'call';
    if (historyFilter === 'disaster') return event.kind === 'disaster';
    return true;
  });

  const renderHistory = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl p-6 text-white shadow-lg">
        <h2 className="text-2xl font-bold mb-2">{t.history_title}</h2>
        <p className="text-indigo-100">{t.history_subtitle}</p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-xl p-4 shadow-md text-center">
          <p className="text-2xl font-bold text-red-600">{sosCount}</p>
          <p className="text-xs text-gray-600 mt-1">{t.history_sosAlerts}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-md text-center">
          <p className="text-2xl font-bold text-blue-600">
            {combinedHistory.length}
          </p>
          <p className="text-xs text-gray-600 mt-1">{t.history_totalEvents}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-md text-center">
          <p className="text-2xl font-bold text-green-600">100%</p>
          <p className="text-xs text-gray-600 mt-1">{t.history_resolvedPercent}</p>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2">
        <button
          className={`px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap ${
            historyFilter === 'all'
              ? 'bg-indigo-500 text-white'
              : 'bg-gray-100 text-gray-700'
          }`}
          onClick={() => setHistoryFilter('all')}
        >
          {t.history_filter_all}
        </button>
        <button
          className={`px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap ${
            historyFilter === 'sos'
              ? 'bg-indigo-500 text-white'
              : 'bg-gray-100 text-gray-700'
          }`}
          onClick={() => setHistoryFilter('sos')}
        >
          {t.history_filter_sos}
        </button>
        <button
          className={`px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap ${
            historyFilter === 'calls'
              ? 'bg-indigo-500 text-white'
              : 'bg-gray-100 text-gray-700'
          }`}
          onClick={() => setHistoryFilter('calls')}
        >
          {t.history_filter_calls}
        </button>
        <button
          className={`px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap ${
            historyFilter === 'disaster'
              ? 'bg-indigo-500 text-white'
              : 'bg-gray-100 text-gray-700'
          }`}
          onClick={() => setHistoryFilter('disaster')}
        >
          {t.history_filter_disaster}
        </button>
      </div>

      <div className="space-y-4">
        {filteredHistory.map((event) => {
          const IconComponent = event.icon;
          const isGuide = event.kind === 'guide';
          return (
            <div
              key={event.id}
              className="bg-white rounded-xl shadow-md p-5 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-lg flex-shrink-0 bg-gray-100">
                  <IconComponent
                    className={isGuide ? 'text-blue-600' : 'text-indigo-600'}
                    size={24}
                  />
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-gray-800">
                      {isGuide ? `${t.history_guidePrefix} ${event.title}` : event.title}
                    </h3>
                    {!isGuide && event.status && (
                      <span className="text-xs font-semibold px-2 py-1 rounded-full bg-green-100 text-green-700">
                        {event.status}
                      </span>
                    )}
                  </div>
                  <div className="space-y-1 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <Clock size={14} />
                      <span>
                        {new Date(event.date).toLocaleDateString()}{' '}
                        {new Date(event.date).toLocaleTimeString()}
                      </span>
                    </div>
                    {event.location && (
                      <div className="flex items-center gap-2">
                        <MapPin size={14} />
                        <span>{event.location}</span>
                      </div>
                    )}
                    {event.description && (
                      <div className="text-gray-500">{event.description}</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        {filteredHistory.length === 0 && (
          <p className="text-sm text-gray-500">{t.history_none}</p>
        )}
      </div>
    </div>
  );

  const renderSettings = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-gray-700 to-gray-800 rounded-xl p-6 text-white shadow-lg">
        <h2 className="text-2xl font-bold mb-2">{t.settings_title}</h2>
        <p className="text-gray-300">{t.settings_subtitle}</p>
      </div>

      <div className="space-y-4">

        {/* Language selector */}
        <div className="bg-white rounded-xl shadow-md p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-semibold text-gray-800">{t.settings_language}</h3>
              <p className="text-sm text-gray-600">{t.settings_languageDesc}</p>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setLanguage('en')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex-1 min-w-[80px] ${
                language === 'en'
                  ? 'bg-blue-500 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {t.settings_lang_english}
            </button>
            <button
              onClick={() => setLanguage('tl')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex-1 min-w-[80px] ${
                language === 'tl'
                  ? 'bg-blue-500 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {t.settings_lang_tagalog}
            </button>
            <button
              onClick={() => setLanguage('ceb')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex-1 min-w-[80px] ${
                language === 'ceb'
                  ? 'bg-blue-500 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {t.settings_lang_cebuano}
            </button>
          </div>
        </div>

        {/* About */}
        <div className="bg-white rounded-xl shadow-md p-5">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-gray-800">{t.settings_about}</h3>
            <Shield className="text-blue-500" size={20} />
          </div>
          <p className="text-sm text-gray-600 mb-3">{t.settings_aboutDesc}</p>
          <p className="text-xs text-gray-500">{t.settings_version}</p>
        </div>
      </div>
    </div>
  );

  // ---------- JSX ----------

return (
  <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
    <header className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-md mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Logo image instead of Shield icon */}
          <Image
            src="/SafePH.png"   // file in /public
            alt="SafePH logo"
            width={40}
            height={40}
            className="rounded-lg"
          />
          <div>
            <h1 className="font-bold text-lg text-gray-800">{t.appTitle}</h1>
            <p className="text-xs text-gray-500">{t.appSubtitle}</p>
          </div>
        </div>
      </div>
    </header>

    <main className="max-w-md mx-auto px-4 py-6 pb-24">
      {activeTab === "home" && renderHome()}
      {activeTab === "guides" && renderGuides()}
      {activeTab === "map" && renderMap()}
      {activeTab === "history" && renderHistory()}
      {activeTab === "settings" && renderSettings()}
    </main>

    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg">
      <div className="max-w-md mx-auto px-2 py-3 flex items-center justify-around">
          <button
            onClick={() => setActiveTab('home')}
            className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors ${
              activeTab === 'home' ? 'text-red-600 bg-red-50' : 'text-gray-600'
            }`}
          >
            <Home size={22} />
            <span className="text-xs font-semibold">{t.tabHome}</span>
          </button>
          <button
            onClick={() => setActiveTab('guides')}
            className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors ${
              activeTab === 'guides' ? 'text-blue-600 bg-blue-50' : 'text-gray-600'
            }`}
          >
            <Book size={22} />
            <span className="text-xs font-semibold">{t.tabGuides}</span>
          </button>
          <button
            onClick={() => setActiveTab('map')}
            className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors ${
              activeTab === 'map' ? 'text-green-600 bg-green-50' : 'text-gray-600'
            }`}
          >
            <MapPin size={22} />
            <span className="text-xs font-semibold">{t.tabMap}</span>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors ${
              activeTab === 'history' ? 'text-indigo-600 bg-indigo-50' : 'text-gray-600'
            }`}
          >
            <History size={22} />
            <span className="text-xs font-semibold">{t.tabHistory}</span>
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors ${
              activeTab === 'settings' ? 'text-gray-600 bg-gray-100' : 'text-gray-600'
            }`}
          >
            <Settings size={22} />
            <span className="text-xs font-semibold">{t.tabSettings}</span>
          </button>
        </div>
      </nav>
    </div>
  );
};

export default EmergencyApp;
