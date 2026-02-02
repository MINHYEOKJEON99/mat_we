import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";

interface VerificationEmailProps {
  confirmationUrl: string;
  userName?: string;
}

export const VerificationEmail = ({
  confirmationUrl,
  userName = "회원",
}: VerificationEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>Mat We 이메일 인증</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Heading style={logo}>Mat We</Heading>
          </Section>

          {/* Content */}
          <Section style={content}>
            <Heading style={heading}>이메일 인증</Heading>
            <Text style={paragraph}>
              안녕하세요, {userName}님!
            </Text>
            <Text style={paragraph}>
              Mat We 주짓수 커뮤니티 가입을 환영합니다.
              <br />
              아래 버튼을 클릭하여 이메일 인증을 완료해주세요.
            </Text>

            <Section style={buttonContainer}>
              <Button style={button} href={confirmationUrl}>
                이메일 인증하기
              </Button>
            </Section>

            <Text style={paragraph}>
              버튼이 작동하지 않으면 아래 링크를 복사하여 브라우저에 붙여넣으세요:
            </Text>
            <Text style={link}>
              <Link href={confirmationUrl} style={linkText}>
                {confirmationUrl}
              </Link>
            </Text>

            <Hr style={hr} />

            <Text style={footer}>
              본 메일은 Mat We 회원가입 시 자동 발송됩니다.
              <br />
              회원가입을 요청하지 않으셨다면 이 메일을 무시해주세요.
            </Text>
          </Section>

          {/* Footer */}
          <Section style={footerSection}>
            <Text style={footerText}>
              © 2025 Mat We. All rights reserved.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default VerificationEmail;

// Styles
const main = {
  backgroundColor: "#f6f9fc",
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Ubuntu, sans-serif',
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "0",
  marginBottom: "64px",
  borderRadius: "8px",
  overflow: "hidden" as const,
  maxWidth: "480px",
};

const header = {
  backgroundColor: "#18181b",
  padding: "32px 24px",
  textAlign: "center" as const,
};

const logo = {
  color: "#ffffff",
  fontSize: "28px",
  fontWeight: "700",
  margin: "0",
  fontFamily: '"DM Serif Text", Georgia, serif',
};

const content = {
  padding: "32px 24px",
};

const heading = {
  color: "#18181b",
  fontSize: "24px",
  fontWeight: "600",
  margin: "0 0 24px",
  textAlign: "center" as const,
};

const paragraph = {
  color: "#525252",
  fontSize: "16px",
  lineHeight: "26px",
  margin: "0 0 16px",
};

const buttonContainer = {
  textAlign: "center" as const,
  margin: "32px 0",
};

const button = {
  backgroundColor: "#18181b",
  borderRadius: "6px",
  color: "#ffffff",
  fontSize: "16px",
  fontWeight: "600",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "12px 32px",
};

const link = {
  margin: "0 0 16px",
};

const linkText = {
  color: "#2563eb",
  fontSize: "14px",
  wordBreak: "break-all" as const,
};

const hr = {
  borderColor: "#e5e7eb",
  margin: "24px 0",
};

const footer = {
  color: "#9ca3af",
  fontSize: "14px",
  lineHeight: "22px",
  margin: "0",
};

const footerSection = {
  backgroundColor: "#f9fafb",
  padding: "24px",
  textAlign: "center" as const,
};

const footerText = {
  color: "#9ca3af",
  fontSize: "12px",
  margin: "0",
};
