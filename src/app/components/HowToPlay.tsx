import { FORMATIONS } from "../../engine";
import { MiniPitch } from "../screens/FormationPicker";
import { ClubBadge } from "./ClubBadge";

function Step({ n, title, children, text }: { n: number; title: string; text: string; children: React.ReactNode }) {
  return (
    <li className="howto__step">
      <div className="howto__visual" aria-hidden>{children}</div>
      <div className="howto__text">
        <h3><span className="howto__n">{n}</span>{title}</h3>
        <p>{text}</p>
      </div>
    </li>
  );
}

function MiniCard({ rating, club, icon }: { rating: number; club?: string; icon?: boolean }) {
  return (
    <span className={icon ? "howto__card howto__card--icon" : "howto__card"}>
      <b>{rating}</b>
      {club ? <ClubBadge club={club} small /> : <span className="howto__icontag">ICON</span>}
    </span>
  );
}

/** The rules as six picture steps, using the same pieces the game shows. */
export function HowToPlay() {
  const f = FORMATIONS.find((x) => x.name === "4-3-3") ?? FORMATIONS[0]!;
  return (
    <ol className="howto">
      <Step n={1} title="Pick a formation" text={`${FORMATIONS.length} shapes, from 4-3-3 to 5-4-1. Every slot is a real position.`}>
        <span className="howto__pitch"><MiniPitch formation={f} /></span>
      </Step>
      <Step n={2} title="Spin and pick" text="Tap Spin to get 4 players, each from a different club. Pick 1 and drop him in a slot he can play. 11 rounds, 2 re-spins.">
        <span className="howto__spin">Spin</span>
        <span className="howto__cards">
          <MiniCard rating={86} club="Arsenal" />
          <MiniCard rating={82} club="Manchester City" />
          <MiniCard rating={79} club="Leeds United" />
          <MiniCard rating={84} club="Chelsea" />
        </span>
      </Step>
      <Step n={3} title="Build chemistry" text="Lines between team-mates show their link. More green means higher chemistry and higher ratings.">
        <span className="howto__links">
          <span><i className="howto__line howto__line--strong" />Same club, or nation and era/league</span>
          <span><i className="howto__line howto__line--weak" />Same nation, or era/league</span>
          <span><i className="howto__line howto__line--none" />No link</span>
        </span>
      </Step>
      <Step n={4} title="Play them in position" text="+2 chemistry in his main position. Anywhere else (amber *) he drops 2.5%. Arrows show the change to his rating.">
        <span className="howto__slots">
          <span className="howto__slot"><b>88 <em className="slot__delta slot__delta--up">▲3</em></b><small>CM · 8</small></span>
          <span className="howto__slot"><b>76 <em className="slot__delta slot__delta--down">▼1</em></b><small><span className="slot__offpos">CM*</span> · 4</small></span>
        </span>
      </Step>
      <Step n={5} title="Hope for an Icon" text="About 1 spin in 20 is an Icon spin: Maradona, Pelé, Messi and more. One per run.">
        <span className="howto__cards">
          <MiniCard rating={95} icon />
          <MiniCard rating={93} icon />
        </span>
      </Step>
      <Step n={6} title="Play the season" text="Your XI replaces a real club and plays every league game, week by week. Win the league, then go again for a streak.">
        <span className="howto__table">
          <span className="howto__row howto__row--you"><b>1</b> Your XI <b>98</b></span>
          <span className="howto__row"><b>2</b> Arsenal <b>87</b></span>
          <span className="howto__row"><b>3</b> Man United <b>80</b></span>
        </span>
      </Step>
    </ol>
  );
}
