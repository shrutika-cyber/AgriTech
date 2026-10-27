export default function About() {
  return (
    <section className="page narrow">
      <h1>About AgriSmart</h1>
      <p>AgriSmart is a student project that shows how digital tools can support farm record-keeping and decision making. It is a demonstration, not a certified agricultural advisory service.</p>
      <h2>What is real and what is simulated</h2>
      <ul>
        <li><strong>Your records</strong> (farms, crops, soil readings, reminders, posts) are real data you enter, stored in local files on the server computer.</li>
        <li><strong>Weather</strong> is simulated and labelled as such.</li>
        <li><strong>Soil and crop guidance</strong> comes from simple, documented rules. It is educational, not a laboratory result and not an AI prediction.</li>
        <li><strong>Marketplace orders and expert consultations</strong> are simulated. No payment is taken and no expert replies.</li>
      </ul>
      <h2>Privacy</h2>
      <p>Passwords are stored only as bcrypt hashes. Data stays on the computer running the server. Community posts are visible to other signed-in users, so do not post personal details. Sample contact details in this demo are placeholders.</p>
      <h2>Responsible use</h2>
      <p>Always follow product labels, local regulations and advice from a qualified agricultural officer. Do not use this app as the only basis for pesticide, fertilizer or irrigation decisions.</p>
    </section>
  );
}
