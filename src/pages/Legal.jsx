import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, ShieldCheck } from 'lucide-react'
import Logo from '../components/Logo'
import { LEGAL, LEGAL_PAGES } from '../lib/legal'

const { companyName, productName, contactEmail, jurisdiction, effectiveDate } = LEGAL

// A block is { h?: heading, p?: paragraph, list?: [items] }.
const SECTIONS = {
  privacy: {
    title: 'Privacy Policy',
    intro: `This Privacy Policy explains how ${companyName} ("we") collects, uses, and protects information in ${productName} (the "Service"), a hazard identification and risk assessment application.`,
    blocks: [
      { h: 'Information we collect', list: [
        'Account information you provide: your name and email address.',
        'Organization information: organization name and address.',
        'Risk-assessment records you enter: assessment name, facility/site, location, status and reference ID; team members (internal and external) you add; activities and their nature (routine / non-routine / emergency); hazards (group, category, type, who may be harmed, probability and severity); existing and additional controls (hierarchy, description, responsible person, department, status, due dates); ALARP decisions; and projected residual risk.',
        'Basic technical data needed to operate the Service (authentication session state).',
      ] },
      { h: 'How we use it', p: 'We use this information solely to provide the Service: building and managing your organization’s risk assessments, computing risk levels on the 5×5 matrix, tracking control actions and due dates, generating dashboards, registers and PDF exports. We do not sell your data or use it for advertising.' },
      { h: 'Storage & processing', p: 'Data is stored in Google Firebase (Cloud Firestore and Firebase Authentication). Each organization’s records are logically isolated, and access is restricted by security rules so that only signed-in members of an organization can read its data.' },
      { h: 'Sharing', p: 'We do not share your data with third parties except the infrastructure provider (Google Firebase) used to host and run the Service, and only as needed to operate it.' },
      { h: 'Retention & deletion', p: 'Records are retained while your organization uses the Service. Deleting a risk assessment from the Repository permanently removes it. See the Data Retention page for details.' },
      { h: 'Your rights & contact', p: `To request access, export, correction, or deletion of your data, contact us at ${contactEmail}.` },
    ],
  },
  terms: {
    title: 'Terms & Conditions',
    intro: `These Terms govern your use of ${productName}, provided by ${companyName}. By using the Service you agree to them.`,
    blocks: [
      { h: 'Acceptable use', p: 'You may use the Service only for lawful occupational health, safety and environmental risk-assessment record-keeping for your own organization. You are responsible for the accuracy of the data you enter and for the actions of the users in your organization.' },
      { h: 'Accounts & organizations', p: 'The first user of an organization is its administrator. Administrators are responsible for managing access and the organization’s data. You are responsible for safeguarding your credentials.' },
      { h: 'Not a substitute for competent judgement', p: `${productName} is a record-keeping, calculation and tracking aid ONLY. It does NOT perform, certify, or replace professional risk assessment, the judgement of a competent person, or any legal/regulatory compliance obligation (including ISO 45001 and applicable OHS law). Risk scores, ALARP determinations, acceptability thresholds and residual-risk calculations are decision-support outputs that you remain solely responsible for reviewing and validating.` },
      { h: 'Disclaimer of warranties', p: 'The Service is provided "AS IS" and "AS AVAILABLE", without warranties of any kind, express or implied, including fitness for a particular purpose and the accuracy of risk calculations, due-date reminders, or exports.' },
      { h: 'Limitation of liability', p: `To the maximum extent permitted by law, ${companyName} shall not be liable for any indirect, incidental, or consequential damages, or for any loss arising from reliance on the Service, including unassessed hazards, missed control actions, or compliance deadlines.` },
      { h: 'Governing law', p: `These Terms are governed by the laws of ${jurisdiction}.` },
      { h: 'Contact', p: `Questions about these Terms: ${contactEmail}.` },
    ],
  },
  retention: {
    title: 'Data Retention & Deletion',
    intro: 'This describes how long data is kept and how to remove it.',
    blocks: [
      { h: 'Active records', p: 'Risk assessments, control actions and organization data are retained for as long as your organization uses the Service.' },
      { h: 'Deletion', p: 'Deleting a risk assessment from the Repository permanently removes that assessment and all of its activities, hazards and controls. This action cannot be undone.' },
      { h: 'Account & organization deletion', p: `To request deletion of your account or your organization’s entire data set, contact ${contactEmail}. We will action verified requests within a reasonable period.` },
      { h: 'Export', p: 'You can export any individual risk assessment as a PDF at any time from the assessment view or the Repository.' },
    ],
  },
  cookies: {
    title: 'Cookies & Storage',
    intro: `${productName} keeps browser storage to a minimum.`,
    blocks: [
      { h: 'What we store', p: 'We use Firebase Authentication, which stores a session token in your browser (session storage) to keep you signed in for the current session. This is strictly necessary for the Service to function and is cleared when you close the browser.' },
      { h: 'What we do NOT use', p: 'We do not use third-party advertising or cross-site tracking cookies, and we do not run analytics that profile you across other websites.' },
      { h: 'Managing it', p: 'Signing out clears your session. Clearing your browser’s site data for this app removes any stored token.' },
      { h: 'Contact', p: `Questions: ${contactEmail}.` },
    ],
  },
}

export default function Legal({ kind = 'privacy' }) {
  const section = SECTIONS[kind] || SECTIONS.privacy

  return (
    <div className="aurora min-h-screen px-4 py-10 text-white">
      <motion.div
        className="mx-auto w-full max-w-3xl"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-white shadow-card">
              <Logo size={20} />
            </span>
            <span className="text-lg font-extrabold tracking-tight">{productName}</span>
          </div>
          <Link to="/login" className="inline-flex items-center gap-1 text-sm text-white/70 hover:text-white">
            <ArrowLeft size={15} /> Back to login
          </Link>
        </div>

        <div className="rounded-3xl bg-clay-surface p-6 text-ink-800 shadow-clay sm:p-9">
          <div className="mb-1 flex items-center gap-2 text-brand-600">
            <ShieldCheck size={18} />
            <span className="text-xs font-bold uppercase tracking-widest">Legal</span>
          </div>
          <h1 className="text-2xl font-extrabold text-ink-900 sm:text-3xl">{section.title}</h1>
          <p className="mt-1 text-sm text-ink-400">Effective date: {effectiveDate}</p>
          {section.intro && <p className="mt-4 text-ink-600">{section.intro}</p>}

          <div className="mt-6 space-y-6">
            {section.blocks.map((b, i) => (
              <section key={i}>
                {b.h && <h2 className="text-base font-bold text-ink-900">{b.h}</h2>}
                {b.p && <p className="mt-1.5 text-sm leading-relaxed text-ink-600">{b.p}</p>}
                {b.list && (
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-relaxed text-ink-600">
                    {b.list.map((it, j) => <li key={j}>{it}</li>)}
                  </ul>
                )}
              </section>
            ))}
          </div>

          {/* Cross-links to the other legal pages */}
          <div className="mt-8 flex flex-wrap gap-x-4 gap-y-2 border-t border-ink-100 pt-5 text-sm">
            {LEGAL_PAGES.map((p) => (
              <Link
                key={p.kind}
                to={p.path}
                className={`font-semibold ${p.kind === kind ? 'text-ink-400' : 'text-brand-600 hover:underline'}`}
              >
                {p.label}
              </Link>
            ))}
          </div>
        </div>

        <p className="mt-5 text-center text-xs text-white/50">
          © {new Date().getFullYear()} {productName}. A risk-assessment record-keeping aid — not a substitute for a competent person’s judgement.
        </p>
      </motion.div>
    </div>
  )
}
