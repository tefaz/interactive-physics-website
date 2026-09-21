type ObserverFigureProps = {
  x: number
  y: number
  scale?: number
  character: 'researcher' | 'alice' | 'bob'
}

/** Feet are anchored at (x, y); the illustration is 180 units tall. */
export function ObserverFigure({ x, y, scale = 1, character }: ObserverFigureProps) {
  const alice = character === 'alice'
  const researcher = character === 'researcher'
  const skin = alice ? '#bd805f' : researcher ? '#e2ad87' : '#bd8a68'
  const shade = alice ? '#995d47' : researcher ? '#be805e' : '#98674e'
  const jacket = alice ? '#d96959' : researcher ? '#e4ac58' : '#429c9e'
  const seam = alice ? '#a44340' : researcher ? '#b97834' : '#286e78'
  return <g transform={`translate(${x} ${y}) scale(${scale})`} strokeLinejoin="round" strokeLinecap="round">
    {/* Hair behind the face, with a distinct tied-back silhouette for Alice. */}
    {alice && <path d="M-10-170C-31-181-32-153-22-139L-13-147Z" fill="#342d36"/>}
    {/* Tailored trousers and shoes; separate silhouettes remain legible when small. */}
    <path d="M-18-83L-17-43-21-8H-7L1-58 7-8H21L18-83Z" fill="#2c4055"/>
    <path d="M2-75L9-11H18L15-76Z" fill="#213246"/>
    <path d="M-21-10H-7L-5-2Q-5 1-10 1H-28Q-31-4-21-10M7-10H21L29-3Q31 1 26 1H7Z" fill="#18283a"/>
    <path d="M-28 1H-7M8 1H27" stroke="#91a2ac" strokeWidth="2"/>
    {/* Relaxed far arm, with a sleeve cuff and a hand attached at the wrist. */}
    <path d="M-18-131Q-27-131-28-118L-32-88-28-72-20-75-22-90-14-119Z" fill={seam}/>
    <path d="M-28-74L-28-65Q-25-58-21-63L-19-71-21-77Z" fill={skin}/>
    <path d="M-8-148V-135L0-128 10-137 8-151Z" fill={skin}/>
    <path d="M-8-148L8-151V-143Q2-138-8-142Z" fill={shade}/>
    {/* Shaped shoulders, inset shirt, collar and hem. */}
    <path d="M-8-138L-20-133Q-24-127-21-115L-19-82Q0-76 20-82L19-119Q22-130 12-134L8-138 0-130Z" fill={jacket}/>
    <path d="M-8-138L0-130 8-138 5-114H-3Z" fill="#f4e9d7"/>
    <path d="M-8-138L-12-129-5-123 0-130M8-138L13-129 7-123 0-130M1-114V-83" fill="none" stroke={seam} strokeWidth="1.7"/>
    <path d="M-17-86Q0-82 17-86" fill="none" stroke={seam} strokeWidth="2"/>
    {researcher && <><rect x="6" y="-119" width="10" height="7" rx="1.5" fill="#f6eddb"/><path d="M9-116h4" stroke="#528b9b" strokeWidth="2"/></>}
    {/* The researcher gestures toward the experiment; the commuters rest a hand at their side. */}
    {researcher ? <>
      <path d="M17-130Q24-132 28-119L34-102 49-112 54-103 33-89Q27-87 23-96L13-116Z" fill={jacket}/>
      <path d="M49-112L56-115 61-121Q64-121 62-116L59-110 65-112Q70-110 65-106L54-102Z" fill={skin}/>
      <path d="M49-111L53-103" stroke={seam} strokeWidth="3"/>
    </> : <>
      <path d="M17-130Q25-130 27-118L32-96Q33-91 28-87L16-77 11-85 22-96 13-117Z" fill={jacket}/>
      <path d="M16-79L9-74Q4-73 4-77L8-82 13-86Z" fill={skin}/>
      <path d="M13-85L18-79" stroke={seam} strokeWidth="2"/>
    </>}
    {/* A connected neck and three-quarter face, without oversized cartoon eyes. */}
    <path d="M-13-167Q-12-179 2-177 16-176 15-161L18-154 14-151Q13-140 4-141L-7-145-12-155Z" fill={skin}/>
    <path d="M-12-161Q-20-166-17-158L-12-153" fill={skin}/>
    <path d={alice ? 'M-14-157Q-21-169-11-177 2-185 13-176L16-167Q4-167-2-173L-9-162-10-155Z' : 'M-14-155Q-22-176-7-179 5-184 15-174L17-167Q5-165-2-172L-9-164-10-155Z'} fill={alice ? '#342d36' : '#35404a'}/>
    <path d="M8-160h2" stroke="#34303a" strokeWidth="2"/>
    <path d="M7-148Q10-146 12-149" fill="none" stroke={shade} strokeWidth="1.5"/>
  </g>
}
