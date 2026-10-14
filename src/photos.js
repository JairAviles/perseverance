// Hand-picked raw images from NASA's Mars 2020 feed: colour, recent, with ground, rocks, horizon or the arm in view
export const CAMERAS = [
  {
    key: 'mastcam',
    name: 'Mastcam-Z',
    part: 'Mastcam_Z_cams',
    photos: [
      { sol: 1998, takenAt: '2026-10-03T16:26:56.230Z', url: 'https://mars.nasa.gov/mars2020-raw-images/pub/ods/surface/sol/01998/ids/edr/browse/zcam/ZL0_1998_0844315306_443EBY_N0910970ZCAM10033_1100LMJ01_1200.jpg' },
      { sol: 2006, takenAt: '2026-10-11T17:20:33.757Z', url: 'https://mars.nasa.gov/mars2020-raw-images/pub/ods/surface/sol/02006/ids/edr/browse/zcam/ZL0_2006_0845009720_145EBY_N0910970ZCAM10036_1100LMJ01_1200.jpg' },
      { sol: 2006, takenAt: '2026-10-11T17:19:10.754Z', url: 'https://mars.nasa.gov/mars2020-raw-images/pub/ods/surface/sol/02006/ids/edr/browse/zcam/ZL0_2006_0845009637_149EBY_N0910970ZCAM10036_1100LMJ01_1200.jpg' },
      { sol: 2006, takenAt: '2026-10-11T17:22:12.749Z', url: 'https://mars.nasa.gov/mars2020-raw-images/pub/ods/surface/sol/02006/ids/edr/browse/zcam/ZL0_2006_0845009815_150EBY_N0910970ZCAM10036_1100LMJ01_1200.jpg' },
      { sol: 2006, takenAt: '2026-10-11T17:16:14.753Z', url: 'https://mars.nasa.gov/mars2020-raw-images/pub/ods/surface/sol/02006/ids/edr/browse/zcam/ZL0_2006_0845009461_147EBY_N0910970ZCAM10036_1100LMJ01_1200.jpg' },
      { sol: 2006, takenAt: '2026-10-11T17:17:44.757Z', url: 'https://mars.nasa.gov/mars2020-raw-images/pub/ods/surface/sol/02006/ids/edr/browse/zcam/ZL0_2006_0845009550_151EBY_N0910970ZCAM10036_1100LMJ01_1200.jpg' },
    ],
  },
  {
    key: 'navcam',
    name: 'Navcam',
    part: 'NavCams',
    photos: [
      { sol: 2006, takenAt: '2026-10-11T23:16:55.373Z', url: 'https://mars.nasa.gov/mars2020-raw-images/pub/ods/surface/sol/02006/ids/edr/browse/ncam/NLF_2006_0845031111_427ECM_N0911496NCAM14006_01_195J01_1200.jpg' },
      { sol: 2006, takenAt: '2026-10-11T23:04:48.719Z', url: 'https://mars.nasa.gov/mars2020-raw-images/pub/ods/surface/sol/02006/ids/edr/browse/ncam/NLF_2006_0845030384_722ECM_N0911496NCAM02006_01_195J01_1200.jpg' },
      { sol: 1995, takenAt: '2026-09-30T17:46:15.548Z', url: 'https://mars.nasa.gov/mars2020-raw-images/pub/ods/surface/sol/01995/ids/edr/browse/ncam/NLF_1995_0844060879_146ECM_N0910970NCAM00709_03_095J01_1200.jpg' },
      { sol: 2006, takenAt: '2026-10-11T22:44:44.150Z', url: 'https://mars.nasa.gov/mars2020-raw-images/pub/ods/surface/sol/02006/ids/edr/browse/ncam/NLF_2006_0845029179_723ECM_N0911496NCAM00709_01_095J01_1200.jpg' },
      { sol: 1989, takenAt: '2026-09-24T11:53:37.829Z', url: 'https://mars.nasa.gov/mars2020-raw-images/pub/ods/surface/sol/01989/ids/edr/browse/ncam/NLF_1989_0843521325_527ECM_N0910970NCAM00709_06_095J01_1200.jpg' },
      { sol: 1995, takenAt: '2026-09-30T17:46:15.548Z', url: 'https://mars.nasa.gov/mars2020-raw-images/pub/ods/surface/sol/01995/ids/edr/browse/ncam/NLF_1995_0844060879_146ECM_N0910970NCAM00709_08_095J01_1200.jpg' },
    ],
  },
  {
    key: 'hazcam',
    name: 'Front Hazcam',
    part: 'hazcams_front',
    photos: [
      { sol: 2005, takenAt: '2026-10-11T00:47:10.535Z', url: 'https://mars.nasa.gov/mars2020-raw-images/pub/ods/surface/sol/02005/ids/edr/browse/fcam/FLF_2005_0844950125_865ECM_N0910970FHAZ00206_01_295J01_1200.jpg' },
      { sol: 1977, takenAt: '2026-09-12T03:24:05.795Z', url: 'https://mars.nasa.gov/mars2020-raw-images/pub/ods/surface/sol/01977/ids/edr/browse/fcam/FLF_1977_0842453961_800ECM_N0910806FHAZ00203_19_295J01_1200.jpg' },
      { sol: 1992, takenAt: '2026-09-27T11:26:22.419Z', url: 'https://mars.nasa.gov/mars2020-raw-images/pub/ods/surface/sol/01992/ids/edr/browse/fcam/FLF_1992_0843778887_805ECM_N0910970FHAZ00215_04_075J02_1200.jpg' },
      { sol: 1982, takenAt: '2026-09-17T05:36:03.772Z', url: 'https://mars.nasa.gov/mars2020-raw-images/pub/ods/surface/sol/01982/ids/edr/browse/fcam/FLF_1982_0842893876_443ECM_N0910970FHAZ00206_01_295J01_1200.jpg' },
      { sol: 2006, takenAt: '2026-10-11T22:49:10.061Z', url: 'https://mars.nasa.gov/mars2020-raw-images/pub/ods/surface/sol/02006/ids/edr/browse/fcam/FLF_2006_0845029445_816ECM_N0911496FHAZ02008_09_095J01_1200.jpg' },
      { sol: 1987, takenAt: '2026-09-22T11:22:28.292Z', url: 'https://mars.nasa.gov/mars2020-raw-images/pub/ods/surface/sol/01987/ids/edr/browse/fcam/FLF_1987_0843346657_067ECM_N0910970FHAZ00215_04_075J01_1200.jpg' },
    ],
  },
  {
    key: 'watson',
    name: 'WATSON',
    part: 'WATSON',
    photos: [
      { sol: 2004, takenAt: '2026-10-10T04:02:30.681Z', url: 'https://mars.nasa.gov/mars2020-raw-images/pub/ods/surface/sol/02004/ids/edr/browse/shrlc/SIF_2004_0844875424_238EBY_N0910970SRLC08065_0000LMJ01_1200.jpg' },
      { sol: 1999, takenAt: '2026-10-04T20:45:01.047Z', url: 'https://mars.nasa.gov/mars2020-raw-images/pub/ods/surface/sol/01999/ids/edr/browse/shrlc/SIF_1999_0844417187_289EBY_N0910970SRLC00351_0000LMJ01_1200.jpg' },
      { sol: 1999, takenAt: '2026-10-04T20:13:42.031Z', url: 'https://mars.nasa.gov/mars2020-raw-images/pub/ods/surface/sol/01999/ids/edr/browse/shrlc/SIF_1999_0844415302_253EBY_N0910970SRLC00351_0000LMJ01_1200.jpg' },
      { sol: 1999, takenAt: '2026-10-04T20:06:28.030Z', url: 'https://mars.nasa.gov/mars2020-raw-images/pub/ods/surface/sol/01999/ids/edr/browse/shrlc/SIF_1999_0844414869_761EBY_N0910970SRLC00657_0000LMJ01_1200.jpg' },
      { sol: 1997, takenAt: '2026-10-02T15:53:51.524Z', url: 'https://mars.nasa.gov/mars2020-raw-images/pub/ods/surface/sol/01997/ids/edr/browse/shrlc/SIF_1997_0844226910_433EBY_N0910970SRLC00430_0000LMJ02_1200.jpg' },
      { sol: 1995, takenAt: '2026-09-30T17:59:34.213Z', url: 'https://mars.nasa.gov/mars2020-raw-images/pub/ods/surface/sol/01995/ids/edr/browse/shrlc/SIF_1995_0844061662_777EBY_N0910970SRLC00741_0000LMJ01_1200.jpg' },
    ],
  },
];
