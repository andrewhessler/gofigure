#[derive(Debug, thiserror::Error)]
#[error(transparent)]
pub struct CmdError(#[from] anyhow::Error);

impl serde::Serialize for CmdError {
    fn serialize<S: serde::Serializer>(&self, s: S) -> Result<S::Ok, S::Error> {
        s.serialize_str(&self.0.to_string())
    }
}
