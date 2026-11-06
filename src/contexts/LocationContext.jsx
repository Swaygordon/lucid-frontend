import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useWorkflowMode, useWorkflowServices } from './WorkflowModeContext.jsx';

// ── Location map images ───────────────────────────────────────────────────────
// Greater Accra
import accraImg              from '../assets/locations/accra.webp';
import temaImg               from '../assets/locations/tema.webp';
import osuImg                from '../assets/locations/osu.webp';
import spintexImg            from '../assets/locations/spintex.webp';
import eastLegonImg          from '../assets/locations/east-legon.webp';
import legonImg              from '../assets/locations/legon.webp';
import northRidgeImg         from '../assets/locations/north-ridge.webp';
import madinaImg             from '../assets/locations/madina.webp';
import labadiImg             from '../assets/locations/labadi.webp';
import achimotaImg           from '../assets/locations/achimota.webp';
import circleImg             from '../assets/locations/circle.webp';
import adabrakaImg           from '../assets/locations/adabraka.webp';
import cantonmentsImg        from '../assets/locations/cantonments.webp';
import airportResidentialImg from '../assets/locations/airport-residential.webp';
import kasoaImg              from '../assets/locations/kasoa.webp';
import teshieImg             from '../assets/locations/teshie.webp';
import nunguaImg             from '../assets/locations/nungua.webp';
import ashaimanImg           from '../assets/locations/ashaiman.webp';
// Ashanti
import kumasiImg             from '../assets/locations/kumasi.webp';
import ejisuImg              from '../assets/locations/ejisu.webp';
import obuasiImg             from '../assets/locations/obuasi.webp';
import asanteMampongImg      from '../assets/locations/asante-mampong.webp';
import konongoImg            from '../assets/locations/konongo.webp';
// Northern
import tamaleImg             from '../assets/locations/tamale.webp';
import yendiImg              from '../assets/locations/yendi.webp';
import saveluguImg           from '../assets/locations/savelugu.webp';
import tolonImg              from '../assets/locations/tolon.webp';
// Western
import takoradiImg           from '../assets/locations/takoradi.webp';
import sekondiImg            from '../assets/locations/sekondi.webp';
import tarkwaImg             from '../assets/locations/tarkwa.webp';
import aximImg               from '../assets/locations/axim.webp';
import presteaImg            from '../assets/locations/prestea.webp';
// Central
import capeCoastImg          from '../assets/locations/cape-coast.webp';
import winnebaImg            from '../assets/locations/winneba.webp';
import elminaImg             from '../assets/locations/elmina.webp';
import mankessimImg          from '../assets/locations/mankessim.webp';
// Eastern
import koforiduaImg          from '../assets/locations/koforidua.webp';
import akosomboImg           from '../assets/locations/akosombo.webp';
import nkawkawImg            from '../assets/locations/nkawkaw.webp';
import suhummImg             from '../assets/locations/suhum.webp';
import akimOdaImg            from '../assets/locations/akim-oda.webp';
// Volta
import hoImg                 from '../assets/locations/ho.webp';
import hohoeImg              from '../assets/locations/hohoe.webp';
import ketaImg               from '../assets/locations/keta.webp';
import aflaoImg              from '../assets/locations/aflao.webp';
import anlogaImg             from '../assets/locations/anloga.webp';
// Bono
import sunyaniImg            from '../assets/locations/sunyani.webp';
import berekumImg            from '../assets/locations/berekum.webp';
import dormaaAhenkroImg      from '../assets/locations/dormaa-ahenkro.webp';
import wenchiImg             from '../assets/locations/wenchi.webp';
// Bono East
import techimanImg           from '../assets/locations/techiman.webp';
import kintampoImg           from '../assets/locations/kintampo.webp';
import atebubuImg            from '../assets/locations/atebubu.webp';
// Ahafo
import goasoImg              from '../assets/locations/goaso.webp';
import bechemImg             from '../assets/locations/bechem.webp';
import kukuomImg             from '../assets/locations/kukuom.webp';
// Upper East
import bolgatangaImg         from '../assets/locations/bolgatanga.webp';
import bawkuImg              from '../assets/locations/bawku.webp';
import navrongoImg           from '../assets/locations/navrongo.webp';
import zebildaImg            from '../assets/locations/zebilla.webp';
// Upper West
import waImg                 from '../assets/locations/wa.webp';
import jirapaImg             from '../assets/locations/jirapa.webp';
import lawraImg              from '../assets/locations/lawra.webp';
import nandomImg             from '../assets/locations/nandom.webp';
// Savannah
import damongoImg            from '../assets/locations/damongo.webp';
import buipeImg              from '../assets/locations/buipe.webp';
import salagaImg             from '../assets/locations/salaga.webp';
// North East
import naleriguImg           from '../assets/locations/nalerigu.webp';
import gambagaImg            from '../assets/locations/gambaga.webp';
import walewaleImg           from '../assets/locations/walewale.webp';
// Oti
import dambaiImg             from '../assets/locations/dambai.webp';
import jasikanImg            from '../assets/locations/jasikan.webp';
import nkwantaImg            from '../assets/locations/nkwanta.webp';
// Western North
import sefwiWiawsoImg        from '../assets/locations/sefwi-wiawso.webp';
import enchiImg              from '../assets/locations/enchi.webp';
import bibianiImg            from '../assets/locations/bibiani.webp';

// All supported Ghana locations grouped by region.
// Used to populate the LocationPicker dropdown.
export const GHANA_LOCATIONS = [
  {
    region: 'Greater Accra',
    areas: [
      'Accra', 'Tema', 'Osu', 'Spintex', 'East Legon', 'Legon', 'North Ridge',
      'Madina', 'Labadi', 'Achimota', 'Circle', 'Adabraka', 'Cantonments',
      'Airport Residential', 'Kasoa', 'Teshie', 'Nungua', 'Ashaiman',
    ],
  },
  {
    region: 'Ashanti',
    areas: ['Kumasi', 'Ejisu', 'Obuasi', 'Asante Mampong', 'Konongo'],
  },
  {
    region: 'Northern',
    areas: ['Tamale', 'Yendi', 'Savelugu', 'Tolon'],
  },
  {
    region: 'Western',
    areas: ['Takoradi', 'Sekondi', 'Tarkwa', 'Axim', 'Prestea'],
  },
  {
    region: 'Central',
    areas: ['Cape Coast', 'Winneba', 'Elmina', 'Mankessim'],
  },
  {
    region: 'Eastern',
    areas: ['Koforidua', 'Akosombo', 'Nkawkaw', 'Suhum', 'Akim Oda'],
  },
  {
    region: 'Volta',
    areas: ['Ho', 'Hohoe', 'Keta', 'Aflao', 'Anloga'],
  },
  {
    region: 'Bono',
    areas: ['Sunyani', 'Berekum', 'Dormaa Ahenkro', 'Wenchi'],
  },
  {
    region: 'Bono East',
    areas: ['Techiman', 'Kintampo', 'Atebubu'],
  },
  {
    region: 'Ahafo',
    areas: ['Goaso', 'Bechem', 'Kukuom'],
  },
  {
    region: 'Upper East',
    areas: ['Bolgatanga', 'Bawku', 'Navrongo', 'Zebilla'],
  },
  {
    region: 'Upper West',
    areas: ['Wa', 'Jirapa', 'Lawra', 'Nandom'],
  },
  {
    region: 'Savannah',
    areas: ['Damongo', 'Buipe', 'Salaga'],
  },
  {
    region: 'North East',
    areas: ['Nalerigu', 'Gambaga', 'Walewale'],
  },
  {
    region: 'Oti',
    areas: ['Dambai', 'Jasikan', 'Nkwanta'],
  },
  {
    region: 'Western North',
    areas: ['Sefwi Wiawso', 'Enchi', 'Bibiani'],
  },
];

export const LOCATION_BACKGROUNDS = {
  // Greater Accra
  'Accra':               accraImg,
  'Tema':                temaImg,
  'Osu':                 osuImg,
  'Spintex':             spintexImg,
  'East Legon':          eastLegonImg,
  'Legon':               legonImg,
  'North Ridge':         northRidgeImg,
  'Madina':              madinaImg,
  'Labadi':              labadiImg,
  'Achimota':            achimotaImg,
  'Circle':              circleImg,
  'Adabraka':            adabrakaImg,
  'Cantonments':         cantonmentsImg,
  'Airport Residential': airportResidentialImg,
  'Kasoa':               kasoaImg,
  'Teshie':              teshieImg,
  'Nungua':              nunguaImg,
  'Ashaiman':            ashaimanImg,
  // Ashanti
  'Kumasi':              kumasiImg,
  'Ejisu':               ejisuImg,
  'Obuasi':              obuasiImg,
  'Asante Mampong':      asanteMampongImg,
  'Konongo':             konongoImg,
  // Northern
  'Tamale':              tamaleImg,
  'Yendi':               yendiImg,
  'Savelugu':            saveluguImg,
  'Tolon':               tolonImg,
  // Western
  'Takoradi':            takoradiImg,
  'Sekondi':             sekondiImg,
  'Tarkwa':              tarkwaImg,
  'Axim':                aximImg,
  'Prestea':             presteaImg,
  // Central
  'Cape Coast':          capeCoastImg,
  'Winneba':             winnebaImg,
  'Elmina':              elminaImg,
  'Mankessim':           mankessimImg,
  // Eastern
  'Koforidua':           koforiduaImg,
  'Akosombo':            akosomboImg,
  'Nkawkaw':             nkawkawImg,
  'Suhum':               suhummImg,
  'Akim Oda':            akimOdaImg,
  // Volta
  'Ho':                  hoImg,
  'Hohoe':               hohoeImg,
  'Keta':                ketaImg,
  'Aflao':               aflaoImg,
  'Anloga':              anlogaImg,
  // Bono
  'Sunyani':             sunyaniImg,
  'Berekum':             berekumImg,
  'Dormaa Ahenkro':      dormaaAhenkroImg,
  'Wenchi':              wenchiImg,
  // Bono East
  'Techiman':            techimanImg,
  'Kintampo':            kintampoImg,
  'Atebubu':             atebubuImg,
  // Ahafo
  'Goaso':               goasoImg,
  'Bechem':              bechemImg,
  'Kukuom':              kukuomImg,
  // Upper East
  'Bolgatanga':          bolgatangaImg,
  'Bawku':               bawkuImg,
  'Navrongo':            navrongoImg,
  'Zebilla':             zebildaImg,
  // Upper West
  'Wa':                  waImg,
  'Jirapa':              jirapaImg,
  'Lawra':               lawraImg,
  'Nandom':              nandomImg,
  // Savannah
  'Damongo':             damongoImg,
  'Buipe':               buipeImg,
  'Salaga':              salagaImg,
  // North East
  'Nalerigu':            naleriguImg,
  'Gambaga':             gambagaImg,
  'Walewale':            walewaleImg,
  // Oti
  'Dambai':              dambaiImg,
  'Jasikan':             jasikanImg,
  'Nkwanta':             nkwantaImg,
  // Western North
  'Sefwi Wiawso':        sefwiWiawsoImg,
  'Enchi':               enchiImg,
  'Bibiani':             bibianiImg,
};

// Fallback for any area not yet in LOCATION_BACKGROUNDS
export const DEFAULT_BACKGROUND = accraImg;

// Resolve the background value for a given search location.
// Returns a CSS gradient string or an imported image path.
export function getLocationBackground(searchLocation) {
  return (
    LOCATION_BACKGROUNDS[searchLocation.area] ??
    LOCATION_BACKGROUNDS[searchLocation.city] ??
    DEFAULT_BACKGROUND
  );
}

export function buildBackgroundStyle(bgValue) {
  return {
    backgroundImage: `url(${bgValue}), linear-gradient(135deg, #1e3a5f 0%, #1d4ed8 45%, #2563eb 100%)`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
  };
}

const EMPTY_LOCATION = { area: '', city: '', region: '' };

export function accountLocationFromProfile(profile = {}) {
  const savedLocations = profile.serviceLocations || profile.service_locations || [];
  const preferred = savedLocations.find(location => location.isDefault || location.is_default) || savedLocations[0];
  const city = preferred?.city || preferred?.homeCity || profile.homeCity || profile.home_city || '';
  const area = preferred?.area || city;
  return {
    area,
    city,
    region: preferred?.region || profile.region || '',
  };
}

const LocationContext = createContext(null);

export function LocationProvider({ children }) {
  const { user, role } = useWorkflowMode();
  const services = useWorkflowServices();
  const userId = user?.id;
  const [defaultLocation, setDefaultLocation] = useState(EMPTY_LOCATION);
  const [searchLocation, setSearchLocation] = useState(EMPTY_LOCATION);

  // Called from account setup saves; keep the search default aligned with the
  // signed-in profile and cache only its non-sensitive area summary.
  const updateDefaultLocation = useCallback((newLocation) => {
    const next = { ...EMPTY_LOCATION, ...newLocation };
    setDefaultLocation(next);
    setSearchLocation(next);
    if (userId) {
      try { localStorage.setItem(`lucid:account-location:${userId}`, JSON.stringify(next)); }
      catch { /* The in-memory account default still works if storage is unavailable. */ }
    }
  }, [userId]);

  useEffect(() => {
    if (!userId) {
      setDefaultLocation(EMPTY_LOCATION);
      setSearchLocation(EMPTY_LOCATION);
      return;
    }
    try {
      const saved = JSON.parse(localStorage.getItem(`lucid:account-location:${userId}`) || 'null');
      const next = saved?.area ? { ...EMPTY_LOCATION, ...saved } : EMPTY_LOCATION;
      setDefaultLocation(next);
      setSearchLocation(next);
    } catch {
      setDefaultLocation(EMPTY_LOCATION);
      setSearchLocation(EMPTY_LOCATION);
    }
  }, [userId]);

  // Refresh the account default from the saved account profile on sign-in.
  // The user-scoped browser value is only a fast initial cache.
  useEffect(() => {
    if (!userId || !role) return undefined;
    let active = true;
    services.profiles.getForRole({ role, userId }).then(result => {
      if (!active || result.error || !result.data) return;
      const accountLocation = accountLocationFromProfile(result.data);
      if (accountLocation.area) updateDefaultLocation(accountLocation);
    }).catch(() => {});
    return () => { active = false; };
  }, [services, role, userId, updateDefaultLocation]);

  // Called by LocationPicker — changes active search location only.
  function changeSearchLocation(area) {
    const group = GHANA_LOCATIONS.find(g => g.areas.includes(area));
    setSearchLocation({
      area,
      city: area,
      region: group?.region ?? '',
    });
  }

  // Resets active search location back to the account default.
  function resetToDefault() {
    setSearchLocation(defaultLocation);
  }

  return (
    <LocationContext.Provider value={{
      defaultLocation,
      searchLocation,
      updateDefaultLocation,
      changeSearchLocation,
      resetToDefault,
    }}>
      {children}
    </LocationContext.Provider>
  );
}

// Named useSearchLocation to avoid shadowing React Router's useLocation.
export function useSearchLocation() {
  const ctx = useContext(LocationContext);
  if (!ctx) throw new Error('useSearchLocation must be used within LocationProvider');
  return ctx;
}
